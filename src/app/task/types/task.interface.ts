import { ObjectId } from 'mongodb';

import { IBaseType } from '@on/utils/types';

import { StaffTaskStatus } from './index.interface';

export interface ITask extends IBaseType {
  caseId: ObjectId;
  merchantId: ObjectId;
  customerId: ObjectId;
  agentId: ObjectId;
  supervisorId: ObjectId;
  title: string;
  description: string;
  day: number;
  scheduledAt: Date;
  scheduledFor: Date;
  status: StaffTaskStatus;
  attempts: number;
  completedAt?: Date;
  meta?: Record<string, any>;
}
