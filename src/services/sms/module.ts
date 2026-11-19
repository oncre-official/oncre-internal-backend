import { Module } from '@nestjs/common';

import { TermiiService } from '@on/services/termii/service';

import { TermiiSmsAdapter } from './adapters/termii';
import { SmsService } from './service';
import { SMS_ADAPTERS } from './type';

// new provider: add the adapter here and its name to SmsProviderName
const ADAPTERS = [TermiiSmsAdapter];

@Module({
  providers: [
    TermiiService,
    ...ADAPTERS,
    { provide: SMS_ADAPTERS, useFactory: (...adapters) => adapters, inject: ADAPTERS },
    SmsService,
  ],
  exports: [SmsService],
})
export class SmsModule {}
