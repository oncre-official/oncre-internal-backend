import { ObjectId } from 'mongodb';

import { IBaseType } from '@on/utils/types';

/**
 * Where a user is in sign-up. Moves forward only.
 * IDENTITY_VERIFIED is the last step: NIN passed (standard merchant) or KYB passed (institution).
 * The wallet opens automatically from there, and the PIN is set from the app, outside onboarding.
 */
export enum OnboardingStep {
  PHONE_PENDING = 'phone_pending',
  PHONE_VERIFIED = 'phone_verified',
  IDENTITY_VERIFIED = 'identity_verified',
}

/** What the app should show next. Returned by every onboarding endpoint. */
export enum OnboardingNextStep {
  VERIFY_PHONE = 'verify_phone',
  NIN = 'nin',
  KYB = 'kyb',
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
  kybFailedAttempts: number;
  kybLockedUntil?: Date;
  /** Set as soon as the user's merchant exists: at sign-up for staff-created merchants, at NIN or KYB for self sign-up. */
  merchantId?: ObjectId;
  /** When the user reached IDENTITY_VERIFIED. */
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
