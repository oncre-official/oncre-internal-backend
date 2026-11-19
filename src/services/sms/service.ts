import { Inject, Injectable } from '@nestjs/common';

import { config } from '@on/config';

import { ProviderRegistry } from '../registry';

import { ISmsProvider, ISmsResult, SMS_ADAPTERS, SmsProviderName } from './type';

/**
 * Send SMS. Uses SMS_PROVIDER by default, or sms.use('termii') for a specific provider.
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
