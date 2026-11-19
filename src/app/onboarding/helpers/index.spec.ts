import {
  generateOtp,
  hashIdNumber,
  hashOtp,
  maskIdNumber,
  normalizeRegNumber,
  safeEqual,
  sameBusinessName,
} from './index';

jest.mock('@on/config', () => ({ config: { kyc: { hashSecret: 'test-secret' } } }));

describe('onboarding helpers', () => {
  it('generates six-digit OTPs', () => {
    for (let i = 0; i < 50; i++) expect(generateOtp()).toMatch(/^\d{6}$/);
  });

  it('hashes OTPs consistently and never returns the code itself', () => {
    expect(hashOtp('482913')).toBe(hashOtp('482913'));
    expect(hashOtp('482913')).not.toBe(hashOtp('482914'));
    expect(hashOtp('482913')).not.toContain('482913');
  });

  it('hashes ID numbers per type', () => {
    expect(hashIdNumber('nin', '12345678901')).not.toBe(hashIdNumber('kyb', '12345678901'));
  });

  it('masks all but the last four digits', () => {
    expect(maskIdNumber('12345678901')).toBe('*******8901');
  });

  it('compares safely, including different lengths', () => {
    expect(safeEqual('abc', 'abc')).toBe(true);
    expect(safeEqual('abc', 'abd')).toBe(false);
    expect(safeEqual('abc', 'abcd')).toBe(false);
  });
});

describe('CAC helpers', () => {
  it('stores RC numbers in one form', () => {
    expect(normalizeRegNumber('RC123456')).toBe('123456');
    expect(normalizeRegNumber(' rc 123-456 ')).toBe('123456');
    expect(normalizeRegNumber('123456')).toBe('123456');
    expect(normalizeRegNumber('bn 998877')).toBe('BN998877');
  });

  it('matches company names, ignoring case, punctuation and LTD / LIMITED / PLC', () => {
    expect(sameBusinessName('Acme Financial Services Limited', 'ACME FINANCIAL SERVICES LTD.')).toBe(true);
    expect(sameBusinessName('Acme Financial Services Ltd', 'acme  financial services')).toBe(true);
    expect(sameBusinessName('Acme Financial Services Ltd', 'Acme Finance Ltd')).toBe(false);
  });
});
