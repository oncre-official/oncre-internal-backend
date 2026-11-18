import { BadGatewayException, Injectable } from '@nestjs/common';

import { TermiiService } from '@on/services/termii/service';

import { ISmsProvider, ISmsResult, SmsProviderName } from '../type';

@Injectable()
export class TermiiSmsAdapter implements ISmsProvider {
  readonly name = SmsProviderName.TERMII;

  constructor(private readonly termii: TermiiService) {}

  async send(to: string, message: string): Promise<ISmsResult> {
    const response = await this.termii.sendMessage(to, message);
    if (!response?.message_id) throw new BadGatewayException('Unable to send SMS at this time.');

    return { provider: this.name, messageId: response.message_id };
  }
}
