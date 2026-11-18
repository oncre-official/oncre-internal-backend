import { INamedProvider } from '../registry';

export enum SmsProviderName {
  TERMII = 'termii',
}

export interface ISmsResult {
  provider: SmsProviderName;
  messageId?: string;
}

/** What every SMS adapter must do. `to` is the full international number, e.g. 2348012345678. */
export interface ISmsProvider extends INamedProvider<SmsProviderName> {
  send(to: string, message: string): Promise<ISmsResult>;
}

export const SMS_ADAPTERS = Symbol('SMS_ADAPTERS');
