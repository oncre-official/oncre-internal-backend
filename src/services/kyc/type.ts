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

export interface INinCheckResult {
  provider: KycProviderName;
  verified: boolean;
  name?: IKycPersonName;
  providerReference?: string;
  failureReason?: string;
}

export interface IKycBusiness {
  legalName: string;
  registrationNumber: string;
}

export interface IBusinessCheckRequest {
  regNumber: string;
}

export interface IBusinessCheckResult {
  provider: KycProviderName;
  verified: boolean;
  business?: IKycBusiness;
  providerReference?: string;
  failureReason?: string;
}

export interface IKycProvider extends INamedProvider<KycProviderName> {
  verifyNin(request: INinCheckRequest): Promise<INinCheckResult>;
  verifyBusiness(request: IBusinessCheckRequest): Promise<IBusinessCheckResult>;
}

export const KYC_ADAPTERS = Symbol('KYC_ADAPTERS');
