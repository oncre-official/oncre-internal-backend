import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { CallRepository } from '@on/app/call/repository/call.repository';
import { MessageRepository } from '@on/app/message/repository/message.repository';
import { MessageScheduleStatus } from '@on/app/message/types/index.interface';

import { MessageHelperService } from '../helpers/message';

const BATCH_SIZE = 200;
const MAX_BATCHES = 10;
const LOCK_MINUTES = 10;
const MAX_ATTEMPTS = 5;

@Injectable()
export class ProcessorService {
  private readonly logger = new Logger(ProcessorService.name);

  constructor(
    private readonly call: CallRepository,
    private readonly message: MessageRepository,
    private readonly helper: MessageHelperService,
  ) {}

  @Cron('*/5 * * * *', { name: 'scheduler-processor', timeZone: 'Africa/Lagos' })
  async processRecoveryActivities(): Promise<void> {
    this.logger.log('Starting recovery activity processing');

    try {
      await this.processDueMessages();

      this.logger.log('Recovery activity processing completed');
    } catch (error: any) {
      this.logger.error(`Recovery activity processing failed: ${error.message}`, error.stack);
    }
  }

  /**
   * PROCESS DUE MESSAGES
   */

  private async processDueMessages(): Promise<void> {
    let processed = 0;
    let failed = 0;

    for (let batch = 0; batch < MAX_BATCHES; batch++) {
      const now = new Date();

      const pendingMessages: any[] = await this.message.aggregate([
        {
          $match: {
            status: { $in: [MessageScheduleStatus.PENDING, MessageScheduleStatus.FAILED] },
            scheduledFor: { $lte: now },
            attempts: { $lt: MAX_ATTEMPTS },
            $or: [{ nextRetryAt: { $exists: false } }, { nextRetryAt: null }, { nextRetryAt: { $lte: now } }],
            $and: [{ $or: [{ lockUntil: { $exists: false } }, { lockUntil: null }, { lockUntil: { $lte: now } }] }],
          },
        },
        { $sort: { scheduledFor: 1, createdAt: 1 } },
        { $limit: BATCH_SIZE },
      ]);

      if (!pendingMessages.length) break;

      for (const message of pendingMessages) {
        try {
          const success = await this.processMessage(message);
          if (success) processed++;
        } catch (error: any) {
          failed++;
          this.logger.error(`Message processing failed for ${message._id}: ${error.message}`, error.stack);
        }
      }

      if (pendingMessages.length < BATCH_SIZE) break;
    }

    this.logger.log(`Message processing completed. Sent: ${processed}, Failed: ${failed}`);
  }

  private async processMessage(message: any): Promise<boolean> {
    const now = new Date();
    const lockUntil = new Date(now.getTime() + LOCK_MINUTES * 60 * 1000);

    const claimed: any = await this.message.findOneAndUpdate(
      {
        _id: message._id,
        status: { $in: [MessageScheduleStatus.PENDING, MessageScheduleStatus.FAILED] },
        scheduledFor: { $lte: now },
        attempts: { $lt: MAX_ATTEMPTS },
        $or: [{ nextRetryAt: { $exists: false } }, { nextRetryAt: null }, { nextRetryAt: { $lte: now } }],
        $and: [{ $or: [{ lockUntil: { $exists: false } }, { lockUntil: null }, { lockUntil: { $lte: now } }] }],
      },
      {
        $set: { status: MessageScheduleStatus.PROCESSING, lockedAt: now, lockUntil },
        $inc: { attempts: 1 },
      },
    );
    if (!claimed) return false;

    try {
      const smsResult = await this.helper.sendRecoveryMessage(claimed);

      const updated = await this.message.findOneAndUpdate(
        { _id: claimed._id, status: MessageScheduleStatus.PROCESSING, lockUntil },
        {
          $set: {
            status: smsResult.success ? MessageScheduleStatus.SENT : MessageScheduleStatus.FAILED,
            serviceMessageId: smsResult.message_id,
            lastError: smsResult.error,
            sentAt: new Date(),
          },
          $unset: { lockedAt: 1, lockUntil: 1, nextRetryAt: 1, lastError: 1 },
        },
      );

      if (!updated) throw new Error('Could not update message delivery status');

      return true;
    } catch (error: any) {
      await this.handleMessageFailure(claimed, lockUntil, error);

      throw error;
    }
  }

  private async handleMessageFailure(message: any, lockUntil: Date, error: any): Promise<void> {
    const attempts = message.attempts ?? 1;
    const exhausted = attempts >= MAX_ATTEMPTS;

    const retryMinutes = Math.min(5 * Math.pow(2, Math.max(attempts - 1, 0)), 60);

    const nextRetryAt = new Date(Date.now() + retryMinutes * 60 * 1000);

    await this.message.findOneAndUpdate(
      { _id: message._id, status: MessageScheduleStatus.PROCESSING, lockUntil },
      {
        $set: {
          status: MessageScheduleStatus.FAILED,
          lastError: error.message,
          ...(exhausted ? {} : { nextRetryAt }),
        },
        $unset: { lockedAt: 1, lockUntil: 1 },
      },
    );
  }
}
