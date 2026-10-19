import { ObjectId } from 'mongodb';

import { IBaseType } from '@on/utils/types';

import { StaffStatus } from './index.interface';

export interface IStaff extends IBaseType {
  userId?: ObjectId;
  supervisorId: ObjectId;
  createdBy: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  code: string;
  address: string;
  status: StaffStatus;
}
