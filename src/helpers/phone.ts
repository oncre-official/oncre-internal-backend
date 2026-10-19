import { DEFAULT_COUNTRY_CODE, SUPPORTED_COUNTRY_CODES } from '@on/data/country';

interface ParsedPhone {
  code: string;
  phone: string;
}

export function formatFullPhone(code: string, phone: string): string {
  return `${code}${phone}`;
}

export function formatDisplayPhone(code: string, phone: string): string {
  return `+${code} ${phone}`;
}

export function parsePhone(fullPhone: string): ParsedPhone {
  let cleaned = fullPhone.trim();

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  cleaned = cleaned.replace(/\D/g, '');

  if (cleaned.startsWith('0')) {
    return {
      code: DEFAULT_COUNTRY_CODE,
      phone: cleaned.replace(/^0+/, ''),
    };
  }

  const countryCode = SUPPORTED_COUNTRY_CODES.find((code) => cleaned.startsWith(code));

  if (countryCode) {
    return {
      code: countryCode,
      phone: cleaned.slice(countryCode.length),
    };
  }

  return {
    code: DEFAULT_COUNTRY_CODE,
    phone: cleaned,
  };
}

export function formatPhoneWithCode(phone: string, code: string = DEFAULT_COUNTRY_CODE): string {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith(code)) return cleaned;

  if (cleaned.startsWith('0')) return `${code}${cleaned.slice(1)}`;

  if (cleaned.length === 10) return `${code}${cleaned}`;

  return cleaned;
}

// ─── Phone Normalization ─────────────────────────────────────
export function normalizePhone(phone: string | number | null | undefined): string {
  if (!phone && phone !== 0) return '';
  let cleaned = String(phone)
    .replace(/[\s().-]/g, '')
    .trim();

  if (cleaned.startsWith('+234')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('234') && cleaned.length >= 13) {
    cleaned = '0' + cleaned.slice(3);
  }

  // Excel stores Nigerian numbers without leading 0: 7065889594 → 07065889594
  if (/^\d{10}$/.test(cleaned) && !cleaned.startsWith('0')) {
    cleaned = '0' + cleaned;
  }

  return cleaned;
}

export function sanitizePhoneNumber(phone: string, countryCode: string = '+234'): string {
  if (!phone) throw new Error('Phone number is required');

  let cleaned = phone.trim().replace(/[^0-9+]/g, '');

  if (cleaned.startsWith('+')) {
    return cleaned;
  }

  cleaned = cleaned.replace(/^0+/, '');

  return `${countryCode}${cleaned}`;
}

export function toInternationalPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  if (normalized.startsWith('0')) {
    return '234' + normalized.slice(1);
  }
  if (normalized.startsWith('+234')) {
    return normalized.slice(1);
  }
  return normalized;
}

export function phoneNationalDigits(phone: string | number | null | undefined): string {
  const digits = normalizePhone(phone).replace(/\D/g, '');
  return digits.slice(-10);
}
