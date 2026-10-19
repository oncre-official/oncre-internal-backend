import { ObjectId } from 'mongodb';

export enum StaffStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
}

export interface ICreateStaff {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  supervisorId?: ObjectId;
  createdBy?: ObjectId;
}
