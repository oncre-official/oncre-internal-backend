import { ObjectId } from 'mongodb';

import { IKycBusiness, IKycPersonName, KycProviderName } from '@on/services/kyc/type';
import { IBaseType } from '@on/utils/types';

export enum KycType {
  NIN = 'nin',
  KYB = 'kyb',
}

export { KycProviderName as KycProvider };

export enum KycStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

export type IKycVerifiedName = IKycPersonName;

export type IKycVerifiedBusiness = IKycBusiness;

export interface IMerchantKyc extends IBaseType {
  userId: ObjectId;
  merchantId?: ObjectId;
  type: KycType;
  provider: KycProviderName;
  idNumberMasked: string;
  idNumberHash: string;
  verifiedName?: IKycVerifiedName;
  verifiedBusiness?: IKycVerifiedBusiness;
  status: KycStatus;
  providerReference?: string;
  failureReason?: string;
  verifiedAt?: Date;
}
