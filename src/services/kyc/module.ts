import { Module } from '@nestjs/common';

import { QoreIdService } from '@on/services/qoreid/service';

import { QoreIdKycAdapter } from './adapters/qoreid';
import { KycService } from './service';
import { KYC_ADAPTERS } from './type';

// new provider: add the adapter here and its name to KycProviderName
const ADAPTERS = [QoreIdKycAdapter];

@Module({
  providers: [
    QoreIdService,
    ...ADAPTERS,
    { provide: KYC_ADAPTERS, useFactory: (...adapters) => adapters, inject: ADAPTERS },
    KycService,
  ],
  exports: [KycService],
})
export class KycModule {}
