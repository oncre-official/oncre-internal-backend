import { INamedProvider } from '../registry';

export enum KycProviderName {
  QOREID = 'qoreid',
}

export interface IKycPersonName {
  firstName: string;
  middleName?: string;
  lastName: string;
  fullName: string;
}

export interface INinCheckRequest {
  nin: string;
  firstName: string;
  lastName: string;
}

/** The parts of a provider's NIN answer the app relies on, the same for every provider. */
export interface INinCheckResult {
  provider: KycProviderName;
  verified: boolean;
  name?: IKycPersonName;
  providerReference?: string;
  failureReason?: string;
}

/** What every KYC adapter must do. Add verifyBusiness (KYB) here when it is built. */
export interface IKycProvider extends INamedProvider<KycProviderName> {
  verifyNin(request: INinCheckRequest): Promise<INinCheckResult>;
}

export const KYC_ADAPTERS = Symbol('KYC_ADAPTERS');
