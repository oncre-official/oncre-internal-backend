import * as crypto from 'crypto';

import { BadRequestException, HttpException, HttpStatus } from '@nestjs/common';

import { config } from '@on/config';
import { formatPhoneWithCode, parsePhone } from '@on/helpers/phone';

export const OTP_TTL_SECONDS = 10 * 60;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_SENDS_PER_HOUR = 5;
export const OTP_MAX_FAILED_ATTEMPTS = 5;
export const OTP_LOCK_MINUTES = 30;
export const NIN_MAX_FAILED_ATTEMPTS = 3;
export const NIN_LOCK_HOURS = 24;
export const ONBOARDING_TOKEN_TTL_SECONDS = 30 * 60;
export const ONBOARDING_TOKEN_SCOPE = 'merchant_onboarding';
export const INVALID_CODE = 'Invalid or expired code.';

/** Any accepted phone format (0801..., 801..., 234801..., +234801...) becomes one stored form. */
export function parseMerchantPhone(value: string): { countryCode: string; phone: string } {
  const { code, phone } = parsePhone(formatPhoneWithCode(value));
  if (!/^\d{7,12}$/.test(phone)) throw new BadRequestException('Invalid phone number.');

  return { countryCode: code, phone };
}

/** Throws 429 while a lock is active, saying how many minutes are left. */
export function assertNotLocked(lockedUntil: Date | undefined, reason: string): void {
  if (!lockedUntil || lockedUntil <= new Date()) return;

  const minutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
  throw new HttpException(`${reason} Please try again in ${minutes} minute(s).`, HttpStatus.TOO_MANY_REQUESTS);
}

/**
 * Derives a key per purpose from KYC_HASH_SECRET. There is deliberately no fallback: if this secret
 * changes, every stored NIN hash stops matching and the one-NIN-one-merchant check silently stops working.
 */
function secret(purpose: string): string {
  const base = config.kyc.hashSecret;
  if (!base) throw new Error('KYC_HASH_SECRET must be configured');

  return crypto.createHmac('sha256', base).update(purpose).digest('hex');
}

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

/** OTPs are stored as a keyed hash, never in plain text. */
export function hashOtp(otp: string): string {
  return crypto.createHmac('sha256', secret('otp')).update(otp).digest('hex');
}

export function hashIdNumber(type: string, idNumber: string): string {
  return crypto.createHmac('sha256', secret('kyc-id')).update(`${type}:${idNumber}`).digest('hex');
}

export function maskIdNumber(idNumber: string): string {
  return `${'*'.repeat(Math.max(idNumber.length - 4, 0))}${idNumber.slice(-4)}`;
}

export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/** Signs onboarding tokens with a different key from login tokens, so they never pass JwtAuthGuard. */
export function onboardingTokenSecret(): string {
  return secret('merchant-onboarding-token');
}
