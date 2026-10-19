import { randomBytes, randomInt } from 'crypto';

import { BadRequestException } from '@nestjs/common';

export const generateRandomNumber = (minLength = 1, maxLength = 6): string => {
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

  let result = '';

  result += Math.floor(Math.random() * 9) + 1;
  for (let i = 1; i < length; i++) {
    result += Math.floor(Math.random() * 10);
  }

  return result;
};

export const generateReference = (prefix = 'REF', randomLength = 4): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = randomBytes(randomLength)
    .toString('hex')
    .substring(0, randomLength * 2)
    .toUpperCase();

  return `${prefix}-${timestamp}-${random}`;
};

export const generateAgentCode = (): string => {
  const random = randomBytes(4).toString('hex').toUpperCase().substring(0, 5);

  return `AE${random}`;
};

export function truncateText(text: string, limit = 5): string {
  return `${text?.toString().slice(0, limit)}${text?.length > limit ? '...' : ''}`;
}

export function getRandomNumber(): number {
  return Math.floor(100000 + Math.random() * 900000);
}

export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';

  const cleanedNumber = phoneNumber.replace(/\D/g, '');

  if (cleanedNumber.length === 11 && cleanedNumber.startsWith('0')) {
    return cleanedNumber.substring(1);
  }

  return cleanedNumber;
}

export function normalizePhoneNumber(phone: string): string {
  if (!phone) throw new Error('Phone number is required');

  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('234')) normalized = normalized.slice(3);

  if (normalized.startsWith('0')) normalized = normalized.slice(1);
  if (normalized.length !== 10) throw new Error('Invalid Nigerian phone number');

  return `+234${normalized}`;
}

export const validateFields = (field: string): string => {
  if (!field || field === 'undefined' || field?.length < 1) {
    throw new BadRequestException('Invalid name in file');
  }
  return field;
};

export function validateAmount(amount: any): void {
  const numericAmount = Number(amount);

  if (isNaN(numericAmount) || numericAmount < 0) {
    throw new BadRequestException('Amount must be a non-negative number.');
  }
}

export function isEmail(value: unknown): boolean {
  if (typeof value !== 'string') return false;

  const email = value.trim();
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;

  return emailRegex.test(email);
}

export function formatNoWithoutZero(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11 && digits.startsWith('0')) return digits;
  if (digits.length === 10 && !digits.startsWith('0')) return '0' + digits;

  throw new BadRequestException('Invalid phone number format. Must be 10 or 11 digits starting with 0.');
}

// ─── Currency ────────────────────────────────────────────────

export function formatNaira(amount: number): string {
  return `₦${amount.toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function capitalize(str: string): string {
  return str
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function truncate(str: string, max: number): string {
  return str.length > max ? str.slice(0, max) + '…' : str;
}

export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function generateRandom16Digit(): string {
  return Array.from({ length: 16 }, () => randomInt(0, 10)).join('');
}
