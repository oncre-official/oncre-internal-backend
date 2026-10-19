import { ObjectId } from 'mongodb';

export interface IInitializeTransaction {
  userId?: ObjectId;
  customerId?: ObjectId;
  body: Record<string, any>;
  logName: string;
  successResponse?: (data: any) => any;
}

export interface IInitializePayment {
  userId?: ObjectId;
  customerId?: ObjectId;
  amount: number;
  email: string;
  tx_ref: string;
  callback_url?: string;
  firstName?: string;
  lastName?: string;
  metadata?: Record<string, any>;
}

export interface IInitializeDirectDebit {
  userId: ObjectId;
  customerId: ObjectId;
  account_bank: string;
  account_number: string;
  address: string;
  email: string;
  phone_number: string;
  narration: string;
}

export interface IInitializeCard extends IInitializePayment {
  card_number: string;
  cvv: string;
  expiry_month: number | string;
  expiry_year: number | string;
  card_holder_name?: string;
}

export interface IInitializeTokenizedCharge {
  userId: ObjectId;
  customerId: ObjectId;
  token: string;
  email: string;
  amount: number;
  tx_ref: string;
  redirect_url?: string;
  firstName?: string;
  lastName?: string;
  ip?: string;
  narration?: string;
  device_fingerprint?: string;
  payment_plan?: number;
  preauthorize?: boolean;
  metadata?: Record<string, any>;
}

export interface IVerifyBank {
  account_number: string;
  account_bank: string;
}

export interface ITransfer {
  userId: ObjectId;
  customerId: ObjectId;
  account_number: string;
  account_bank: string;
  amount: number;
  reason: string;
  reference: string;
  callback_url?: string;
  metadata?: Record<string, any>;
}
