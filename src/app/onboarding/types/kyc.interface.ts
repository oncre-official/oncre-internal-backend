import { ObjectId } from 'mongodb';

import { IKycPersonName, KycProviderName } from '@on/services/kyc/type';
import { IBaseType } from '@on/utils/types';

export enum KycType {
  NIN = 'nin',
  KYB = 'kyb',
}

/** Which provider checked the record. Comes from the KYC provider list. */
export { KycProviderName as KycProvider };

export enum KycStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  FAILED = 'failed',
}

/** Official name of a person, from their NIN record. Used for standard merchants. */
export type IKycVerifiedName = IKycPersonName;

/** Official details of a business, from its registration record. Used for institutions (KYB). */
export interface IKycVerifiedBusiness {
  legalName: string;
  registrationNumber: string;
}

export interface IMerchantKyc extends IBaseType {
  userId: ObjectId;
  merchantId?: ObjectId;
  type: KycType;
  provider: KycProviderName;
  idNumberMasked: string;
  idNumberHash: string;
  /** Set on a verified NIN check. */
  verifiedName?: IKycVerifiedName;
  /** Set on a verified KYB check. */
  verifiedBusiness?: IKycVerifiedBusiness;
  status: KycStatus;
  providerReference?: string;
  failureReason?: string;
  verifiedAt?: Date;
}
