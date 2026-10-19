import { ObjectId } from 'mongodb';

import { IBaseType } from '@on/utils/types';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  VIEW = 'VIEW',
  UPLOAD = 'UPLOAD',
  EXPORT = 'EXPORT',
  ASSIGN = 'ASSIGN',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
}

export enum AuditModule {
  AUTH = 'auth',
  USER = 'user',
  CASE = 'case',
  MERCHANT = 'merchant',
  CUSTOMER = 'customer',
  RECOVERY = 'recovery',
  PAYMENT = 'payment',
  ROLE = 'role',
  SYSTEM = 'system',
}

export enum AuditStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
}

export interface IAuditLog extends IBaseType {
  userId?: ObjectId;
  userName?: string;
  action: AuditAction;
  module: AuditModule;
  description: string;
  recordId?: ObjectId;
  recordType?: string;
  recordReference?: string;
  status: AuditStatus;
  ip?: string;
  userAgent?: string;
  meta?: Record<string, any>;
  createdAt?: Date;
}

export interface CreateAuditLogPayload {
  action: AuditAction;
  module: AuditModule;
  description: string;
  status?: AuditStatus;
  recordId?: ObjectId | string;
  recordType?: string;
  recordReference?: string;
  metadata?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}
