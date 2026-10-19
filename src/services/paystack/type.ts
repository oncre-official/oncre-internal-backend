import { IExternalLog } from '@on/app/log/type/log.interface';
import { ObjectId } from 'mongodb';


interface IInitializeRequest {
  userId: ObjectId;
  customerId: ObjectId;
  email: string;
  reference: string;
  callback_url?: string;
  metadata: Record<string, any>;
}

export interface IInitializeCard extends IInitializeRequest {}

export interface IChargeAuthorization {
  userId: ObjectId;
  customerId: ObjectId;
  email: string;
  amount: number;
  authorization_code: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface IInitializeDirectDebit {
  userId: ObjectId;
  customerId: ObjectId;
  email: string;
  callback_url?: string;
  account: {
    number: string;
    bank_code: string;
  };
  address: {
    state: string;
    city: string;
    street: string;
  };
  metadata?: Record<string, any>;
}

export interface IInitializePayment extends IInitializeRequest {
  amount: number;
}

export interface IInitializeTransaction {
  userId?: ObjectId;
  customerId?: ObjectId;
  body: Record<string, any>;
  logName: string;
  successResponse?: (data: IPaystackInitializeResponse) => any;
}

export interface IPaystackInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface IVerifyBank {
  account_number: string;
  bank_code: string;
}

export interface InitiateTransfer {
  userId: ObjectId;
  customerId: ObjectId;
  account_number: string;
  bank_code: string;
  amount: number;
  reason?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface ICreateTransferRecipient {
  userId: ObjectId;
  customerId: ObjectId;
  account_number: string;
  bank_code: string;
  name?: string;
  currency?: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ITransfer {
  userId?: ObjectId;
  customerId?: ObjectId;
  recipient: string;
  amount: number;
  reason?: string;
  reference?: string;
  metadata?: Record<string, any>;
}

export interface ILogRequest extends Partial<IExternalLog> {
  startedAt: number;
}
