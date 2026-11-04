import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { CallRepository } from '@on/app/call/repository/call.repository';
import { CallScheduleStatus } from '@on/app/call/types/index.interface';
import { IRecoveryEngineConfig, RECOVERY_ENGINES } from '@on/app/case/helper/const';
import { CaseRepository } from '@on/app/case/repository/case.repository';
import { CaseStatus, RecoveryClassification, RecoveryScheduleStatus } from '@on/app/case/types/index.interface';
import { MessageRepository } from '@on/app/message/repository/message.repository';
import { MessageScheduleStatus } from '@on/app/message/types/index.interface';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  private readonly BATCH_SIZE = 200;
  private readonly MAX_BATCHES = 20;
  private readonly LOCK_MINUTES = 15;

  constructor(
    private readonly cases: CaseRepository,
    private readonly call: CallRepository,
    private readonly message: MessageRepository,
  ) {}

  @Cron('*/10 * * * *', { name: 'scheduler', timeZone: 'Africa/Lagos' })
  async processCallSchedules(): Promise<void> {
    this.logger.log('Starting recovery call scheduling');

    let processed = 0;
    let failed = 0;

    try {
      for (let batch = 0; batch < this.MAX_BATCHES; batch++) {
        const cases = await this.cases.aggregate([
          { $match: this.getPendingCasesQuery() },
          { $sort: { createdAt: 1 } },
          { $limit: this.BATCH_SIZE },
          {
            $project: {
              _id: 1,
              caseId: 1,
              merchantId: 1,
              customerId: 1,
              classification: 1,
              schedule: 1,
              activatedAt: 1,
              createdAt: 1,
            },
          },
        ]);

        if (!cases.length) break;

        for (const recoveryCase of cases) {
          try {
            const scheduled = await this.scheduleCase(recoveryCase);
            if (scheduled) processed++;
          } catch (error: any) {
            failed++;

            this.logger.error(
              `Failed to generate schedules for case ${recoveryCase.caseId}: ${error.message}`,
              error.stack,
            );
          }
        }

        if (cases.length < this.BATCH_SIZE) break;
      }

      this.logger.log(`Recovery schedule generation completed. Processed: ${processed}, Failed: ${failed}`);
    } catch (error: any) {
      this.logger.error(`Recovery schedule generation cron failed: ${error.message}`, error.stack);
    }
  }

  /**
   * PRIVATE METHODS
   */

  private getPendingCasesQuery(): Record<string, any> {
    const now = new Date();

    return {
      status: { $nin: [CaseStatus.PAID_IN_FULL_CLOSED] },
      paused: { $ne: true },
      $and: [
        {
          $or: [
            { 'schedule.call.scheduled': { $ne: true } },
            { 'schedule.messaging.scheduled': { $ne: true } },
            { schedule: { $exists: false } },
          ],
        },
        {
          $or: [
            { 'schedule.lockUntil': { $exists: false } },
            { 'schedule.lockUntil': null },
            { 'schedule.lockUntil': { $lte: now } },
          ],
        },
      ],
    };
  }

  private async scheduleCase(recoveryCase: any): Promise<boolean> {
    const config = this.getRecoveryConfig(recoveryCase.classification);

    if (!config) {
      this.logger.warn(`No recovery configuration found for ${recoveryCase.caseId}`);
      return false;
    }

    const now = new Date();
    const lockUntil = new Date(now.getTime() + this.LOCK_MINUTES * 60 * 1000);

    const claimedCase: any = await this.cases.findOneAndUpdate(
      {
        _id: recoveryCase._id,
        status: { $nin: [CaseStatus.PAID_IN_FULL_CLOSED] },
        paused: { $ne: true },
        $and: [
          {
            $or: [
              { 'schedule.call.scheduled': { $ne: true } },
              { 'schedule.messaging.scheduled': { $ne: true } },
              { schedule: { $exists: false } },
            ],
          },
          {
            $or: [
              { 'schedule.lockUntil': { $exists: false } },
              { 'schedule.lockUntil': null },
              { 'schedule.lockUntil': { $lte: now } },
            ],
          },
        ],
      },
      {
        $set: {
          'schedule.engine': recoveryCase.classification,
          'schedule.duration': config.duration,
          'schedule.status': RecoveryScheduleStatus.PROCESSING,
          'schedule.lockedAt': now,
          'schedule.lockUntil': lockUntil,
        },
        $inc: { 'schedule.attempts': 1 },
      },
    );

    if (!claimedCase) return false;

    try {
      const baseDate = claimedCase.activatedAt ?? claimedCase.createdAt ?? new Date(Date.now() - SEVEN_DAYS_MS);

      if (claimedCase.schedule?.call?.scheduled !== true) await this.createCallSchedules(claimedCase, config, baseDate);
      if (claimedCase.schedule?.messaging?.scheduled !== true)
        await this.createMessageSchedules(claimedCase, config, baseDate);

      const [callTotal, messageTotal] = await Promise.all([
        this.call.count({ caseId: claimedCase._id }),
        this.message.count({ caseId: claimedCase._id }),
      ]);

      const updated = await this.cases.findOneAndUpdate(
        { _id: claimedCase._id, 'schedule.lockUntil': lockUntil },
        {
          $set: {
            'schedule.call.scheduled': true,
            'schedule.call.scheduledAt': new Date(),
            'schedule.call.total': callTotal,

            'schedule.messaging.scheduled': true,
            'schedule.messaging.scheduledAt': new Date(),
            'schedule.messaging.total': messageTotal,

            'schedule.lastAttemptAt': new Date(),
            'schedule.status': RecoveryScheduleStatus.PARTIALLY_SCHEDULED,
          },
          $unset: {
            'schedule.lockedAt': 1,
            'schedule.lockUntil': 1,
            'schedule.lastError': 1,
          },
        },
      );

      if (!updated) throw new BadRequestException('Could not finalize case call scheduling');

      this.logger.log(
        `Successfully scheduled ${callTotal} calls and ${messageTotal} messages for ${claimedCase.caseId}`,
      );

      return true;
    } catch (error: any) {
      await this.cases.findOneAndUpdate(
        { _id: claimedCase._id, 'schedule.lockUntil': lockUntil },
        {
          $set: {
            'schedule.status': RecoveryScheduleStatus.FAILED,
            'schedule.lastError': error.message,
            'schedule.lastAttemptAt': new Date(),
          },
          $unset: { 'schedule.lockedAt': 1, 'schedule.lockUntil': 1 },
        },
      );

      throw error;
    }
  }

  private async createCallSchedules(recoveryCase: any, config: IRecoveryEngineConfig, baseDate: Date): Promise<void> {
    const days = [...new Set(config.calls)];

    await Promise.all(
      days.map((day) => {
        const scheduledFor = this.getScheduledDate(baseDate, day);

        return this.call.findOneAndCreate(
          { caseId: recoveryCase._id, day },
          {
            caseId: recoveryCase._id,
            merchantId: recoveryCase.merchantId,
            customerId: recoveryCase.customerId,
            day,
            scheduledAt: new Date(),
            scheduledFor,
            status: CallScheduleStatus.PENDING,
            attempts: 0,
            meta: {
              classification: recoveryCase.classification,
            },
          },
        );
      }),
    );
  }

  private async createMessageSchedules(
    recoveryCase: any,
    config: IRecoveryEngineConfig,
    baseDate: Date,
  ): Promise<void> {
    const days = [...new Set(config.messages ?? [])];

    await Promise.all(
      days.map((day) => {
        const scheduledFor = this.getScheduledDate(baseDate, day);

        return this.message.findOneAndCreate(
          { caseId: recoveryCase._id, day },
          {
            caseId: recoveryCase._id,
            merchantId: recoveryCase.merchantId,
            customerId: recoveryCase.customerId,
            day,
            scheduledAt: new Date(),
            scheduledFor,
            status: MessageScheduleStatus.PENDING,
            attempts: 0,
            meta: {
              classification: recoveryCase.classification,
            },
          },
        );
      }),
    );
  }

  private getScheduledDate(baseDate: Date, day: number): Date {
    if (day <= 1) return new Date(baseDate);

    const scheduledFor = new Date(baseDate.getTime() + 60 * 60 * 1000);

    scheduledFor.setUTCDate(scheduledFor.getUTCDate() + day - 1);
    scheduledFor.setUTCHours(7, 0, 0, 0);

    return scheduledFor;
  }

  private getRecoveryConfig(classification: RecoveryClassification): IRecoveryEngineConfig | null {
    return RECOVERY_ENGINES[classification] ?? null;
  }
}
