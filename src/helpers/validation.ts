export function isValidCreditId(id: string): boolean {
  return typeof id === 'string' && id.trim().length > 0;
}

export function isValidMerchantId(id: string): boolean {
  return typeof id === 'string' && id.trim().length > 0;
}

export function isPositiveNumber(val: unknown): val is number {
  return typeof val === 'number' && val > 0 && isFinite(val);
}
