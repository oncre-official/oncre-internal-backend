import { NotImplementedException } from '@nestjs/common';

export interface INamedProvider<TName extends string = string> {
  readonly name: TName;
}

/**
 * Holds every adapter for one kind of service (SMS, KYC, bank...) and hands one out by name.
 * `use()` with no name returns the default chosen in config, so switching providers is a config
 * change; `use('name')` picks one for a single call.
 */
export class ProviderRegistry<TName extends string, TProvider extends INamedProvider<TName>> {
  private readonly providers = new Map<TName, TProvider>();

  constructor(
    private readonly kind: string,
    adapters: TProvider[],
    private readonly defaultName: TName,
  ) {
    adapters.forEach((adapter) => this.providers.set(adapter.name, adapter));
  }

  use(name: TName = this.defaultName): TProvider {
    const provider = this.providers.get(name);
    if (!provider) throw new NotImplementedException(`${this.kind} provider "${name}" is not registered.`);

    return provider;
  }

  has(name: TName): boolean {
    return this.providers.has(name);
  }

  get default(): TName {
    return this.defaultName;
  }

  list(): TName[] {
    return [...this.providers.keys()];
  }
}
