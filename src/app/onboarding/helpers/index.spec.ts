import { generateOtp, hashIdNumber, hashOtp, maskIdNumber, safeEqual } from './index';

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
