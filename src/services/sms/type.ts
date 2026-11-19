import { INamedProvider } from '../registry';

export enum SmsProviderName {
  TERMII = 'termii',
}

export interface ISmsResult {
  provider: SmsProviderName;
  messageId?: string;
}

// to: 2348012345678
export interface ISmsProvider extends INamedProvider<SmsProviderName> {
  send(to: string, message: string): Promise<ISmsResult>;
}

export const SMS_ADAPTERS = Symbol('SMS_ADAPTERS');
