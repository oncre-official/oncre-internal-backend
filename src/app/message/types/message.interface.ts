import { ObjectId } from 'mongodb';

import { IBaseType } from '@on/utils/types';

import { MessageScheduleStatus, MessageType } from './index.interface';

export interface IMessage extends IBaseType {
  caseId: ObjectId;
  merchantId: ObjectId;
  customerId: ObjectId;
  day: number;
  scheduledAt: Date;
  scheduledFor: Date;
  type: MessageType;
  status: MessageScheduleStatus;
  serviceMessageId: string;
  paymentLinkGenerated: boolean;
  attempts: number;
  lockedAt?: Date;
  lockUntil?: Date;
  nextRetryAt?: Date;
  lastError?: string;
  sentAt?: Date;
  meta?: Record<string, any>;
}
