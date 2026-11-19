import { NotImplementedException } from '@nestjs/common';

export interface INamedProvider<TName extends string = string> {
  readonly name: TName;
}

/**
 * Provider switcher. use() returns the default from config, use('name') returns that provider.
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
