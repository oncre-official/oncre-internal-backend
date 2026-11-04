import { ObjectId } from 'mongodb';

import { IBaseType } from '@on/utils/types';

import { CallOutcome, CallScheduleStatus } from './index.interface';

export interface ICall extends IBaseType {
  caseId: ObjectId;
  merchantId: ObjectId;
  customerId: ObjectId;
  day: number;
  scheduledAt: Date;
  scheduledFor: Date;
  status: CallScheduleStatus;
  attempts: number;
  completedAt?: Date;
  outcome?: CallOutcome;
  notes?: string;
  meta?: Record<string, any>;
}
