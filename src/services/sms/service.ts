import { Inject, Injectable } from '@nestjs/common';

import { config } from '@on/config';

import { ProviderRegistry } from '../registry';

import { ISmsProvider, ISmsResult, SMS_ADAPTERS, SmsProviderName } from './type';

/**
 * The only way the app sends SMS.
 *   sms.send(to, text)              → default provider (SMS_PROVIDER in .env)
 *   sms.use('termii').send(to, text) → a specific provider for this call
 */
@Injectable()
export class SmsService extends ProviderRegistry<SmsProviderName, ISmsProvider> {
  constructor(@Inject(SMS_ADAPTERS) adapters: ISmsProvider[]) {
    super('SMS', adapters, config.providers.sms as SmsProviderName);
  }

  async send(to: string, message: string): Promise<ISmsResult> {
    return await this.use().send(to, message);
  }
}
