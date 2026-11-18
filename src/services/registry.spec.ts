import { NotImplementedException } from '@nestjs/common';

import { ProviderRegistry } from './registry';

type Name = 'alpha' | 'beta' | 'gamma';
const alpha = { name: 'alpha' as const, ping: () => 'alpha' };
const beta = { name: 'beta' as const, ping: () => 'beta' };

describe('ProviderRegistry', () => {
  const registry = new ProviderRegistry<Name, { name: Name; ping: () => string }>('Test', [alpha, beta], 'alpha');

  it('returns the default provider when no name is given', () => {
    expect(registry.use().ping()).toBe('alpha');
    expect(registry.default).toBe('alpha');
  });

  it('returns a named provider for one call', () => {
    expect(registry.use('beta').ping()).toBe('beta');
  });

  it('lists and checks registered providers', () => {
    expect(registry.list()).toEqual(['alpha', 'beta']);
    expect(registry.has('gamma')).toBe(false);
  });

  it('refuses a provider that is not registered', () => {
    expect(() => registry.use('gamma')).toThrow(NotImplementedException);
  });
});
