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

/** Official details of a business, from its CAC record. */
export interface IKycBusiness {
  legalName: string;
  registrationNumber: string;
}

export interface IBusinessCheckRequest {
  /** RC, BN or IT number, already cleaned (upper case, no spaces). */
  regNumber: string;
}

/** The parts of a provider's business (KYB) answer the app relies on, the same for every provider. */
export interface IBusinessCheckResult {
  provider: KycProviderName;
  verified: boolean;
  business?: IKycBusiness;
  providerReference?: string;
  failureReason?: string;
}

/** What every KYC adapter must do. */
export interface IKycProvider extends INamedProvider<KycProviderName> {
  verifyNin(request: INinCheckRequest): Promise<INinCheckResult>;
  verifyBusiness(request: IBusinessCheckRequest): Promise<IBusinessCheckResult>;
}

export const KYC_ADAPTERS = Symbol('KYC_ADAPTERS');
