import { ObjectId } from 'mongodb';

import { IBaseType } from '@on/utils/types';

export enum CustomerStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CASH_ONLY = 'cash_only',
}

export interface ICustomer extends IBaseType {
  userId?: ObjectId;
  createdBy?: ObjectId;
  customerId: string;
  phone: string;
  key: string;
  name: string;
  address: string;
  stateId?: ObjectId;
  lgaId?: ObjectId;
  status: CustomerStatus;
  businessName?: string;
}

export interface ICreateCustomer {
  phone: string;
  name?: string;
  key?: string;
  businessName?: string;
  address?: string;
  createdBy?: ObjectId;
  stateId?: ObjectId;
  lgaId?: ObjectId;
}
