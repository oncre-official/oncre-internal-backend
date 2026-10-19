import { ObjectId } from 'mongodb';

import { IBaseType } from '@on/utils/types';

export enum ExternalRequestStatus {
  SUCCESS = 'success',
  FAILED = 'failed',
}

export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  OPTIONS = 'OPTIONS',
}

export interface ILog extends IBaseType {
  userId?: ObjectId;
  customerId?: ObjectId;
  name: string;
  level: LogLevel;
  method?: HttpMethod;
  path?: string;
  statusCode?: number;
  ip?: string;
  userAgent?: string;
  duration?: number;
  meta?: Record<string, any>;
  error?: Record<string, any>;
}

export interface IExternalLog extends IBaseType {
  userId?: ObjectId;
  customerId?: ObjectId;
  name: string;
  provider?: string;
  method: string;
  url: string;
  status: ExternalRequestStatus;
  statusCode?: number;
  duration?: number;
  request?: Record<string, any>;
  response?: Record<string, any>;
  error?: Record<string, any>;
  meta?: Record<string, any>;
}
