import { ObjectId } from 'mongodb';

import { IBaseType } from '@on/utils/types';

// IDENTITY_VERIFIED = onboarding done (NIN for standard, KYB for institutions)
export enum OnboardingStep {
  PHONE_PENDING = 'phone_pending',
  PHONE_VERIFIED = 'phone_verified',
  IDENTITY_VERIFIED = 'identity_verified',
}

export enum OnboardingNextStep {
  VERIFY_PHONE = 'verify_phone',
  NIN = 'nin',
  WALLET = 'wallet',
}

export interface IMerchantOnboarding extends IBaseType {
  userId: ObjectId;
  countryCode: string;
  phone: string;
  step: OnboardingStep;
  otpSendCount: number;
  otpWindowStartedAt?: Date;
  lastOtpSentAt?: Date;
  otpFailedAttempts: number;
  otpLockedUntil?: Date;
  ninFailedAttempts: number;
  ninLockedUntil?: Date;
  merchantId?: ObjectId;
  completedAt?: Date;
}

export interface ISignupResult {
  nextStep: OnboardingNextStep;
  expiresInSeconds: number;
}

export interface IVerifyPhoneResult {
  nextStep: OnboardingNextStep;
  onboardingToken: string;
}

export interface IMerchantLoginCodeSent {
  expiresInSeconds: number;
}

export interface IMerchantLoginResult {
  token: string;
  user: { _id: ObjectId; countryCode: string; phone: string };
  merchant: { _id: ObjectId; merchantId: string; name: string; type: string };
}
