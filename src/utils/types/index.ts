import { ObjectId } from 'mongodb';

export interface ServiceResponse<T> {
  data: T;
  message: string;
}

export interface PaginatedResponse<T> {
  count: number;
  row: T[];
}

export interface ResponseDTO {
  success: boolean;
  data: null | object;
  message: string;
}

export interface IBaseType {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export enum PaymentType {
  CARD = 'card',
  REPAYMENT = 'repayment',
  DIRECT_DEBIT = 'direct-debit',
  BUFFER_PURCHASE = 'buffer-purchase',
  MERCHANT_PAYMENT = 'merchant-payment',
}

export enum PaymentProvider {
  PAYSTACK = 'paystack',
  FLUTTERWAVE = 'flutterwave',
}
