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

export function parseMerchantPhone(value: string): { countryCode: string; phone: string } {
  const { code, phone } = parsePhone(formatPhoneWithCode(value));
  if (!/^\d{7,12}$/.test(phone)) throw new BadRequestException('Invalid phone number.');

  return { countryCode: code, phone };
}

// RC123456 -> 123456
export function normalizeRegNumber(value: string): string {
  const cleaned = value.toUpperCase().replace(/[\s-]/g, '');

  return cleaned.startsWith('RC') ? cleaned.slice(2) : cleaned;
}

// ignores case, punctuation and LTD/LIMITED/PLC
export function sameBusinessName(a: string, b: string): boolean {
  const clean = (name: string) =>
    name
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((word) => word && !['LTD', 'LIMITED', 'PLC'].includes(word))
      .join(' ');

  return clean(a) === clean(b);
}

export function assertNotLocked(lockedUntil: Date | undefined, reason: string): void {
  if (!lockedUntil || lockedUntil <= new Date()) return;

  const minutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60000);
  throw new HttpException(`${reason} Please try again in ${minutes} minute(s).`, HttpStatus.TOO_MANY_REQUESTS);
}

// NOTE: don't change KYC_HASH_SECRET, the saved NIN hashes depend on it
function secret(purpose: string): string {
  const base = config.kyc.hashSecret;
  if (!base) throw new Error('KYC_HASH_SECRET must be configured');

  return crypto.createHmac('sha256', base).update(purpose).digest('hex');
}

export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

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

// separate secret so onboarding tokens can't be used as login tokens
export function onboardingTokenSecret(): string {
  return secret('merchant-onboarding-token');
}
