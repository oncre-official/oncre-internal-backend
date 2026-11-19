import { Inject, Injectable } from '@nestjs/common';

import { config } from '@on/config';

import { ProviderRegistry } from '../registry';

import {
  IBusinessCheckRequest,
  IBusinessCheckResult,
  IKycProvider,
  INinCheckRequest,
  INinCheckResult,
  KYC_ADAPTERS,
  KycProviderName,
} from './type';

/**
 * KYC checks. Uses KYC_PROVIDER by default, or kyc.use('qoreid') for a specific provider.
 */
@Injectable()
export class KycService extends ProviderRegistry<KycProviderName, IKycProvider> {
  constructor(@Inject(KYC_ADAPTERS) adapters: IKycProvider[]) {
    super('KYC', adapters, config.providers.kyc as KycProviderName);
  }

  async verifyNin(request: INinCheckRequest): Promise<INinCheckResult> {
    return await this.use().verifyNin(request);
  }

  async verifyBusiness(request: IBusinessCheckRequest): Promise<IBusinessCheckResult> {
    return await this.use().verifyBusiness(request);
  }
}
