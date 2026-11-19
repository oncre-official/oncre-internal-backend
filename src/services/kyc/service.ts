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
 * The only way the app checks identities.
 *   kyc.verifyNin(req)              → default provider (KYC_PROVIDER in .env)
 *   kyc.verifyBusiness(req)         → default provider, business (KYB) check
 *   kyc.use('qoreid').verifyNin(req) → a specific provider for this call
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
