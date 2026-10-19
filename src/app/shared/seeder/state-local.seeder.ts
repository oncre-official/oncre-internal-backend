import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';

import { StateLga } from '../data/state-lga.data';
import { LgaRepository } from '../repository/local-govt.repository';
import { StateRepository } from '../repository/state.repository';

@Injectable()
export class StateLgaSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(StateLgaSeeder.name);

  constructor(
    private readonly lga: LgaRepository,
    private readonly state: StateRepository,
  ) {}

  async onApplicationBootstrap() {
    for (const stateLga of StateLga) {
      const { state: name, alias } = stateLga;

      let state = await this.state.findOne({ alias });
      if (!state) state = await this.state.create({ name, alias });

      for (const lgaName of stateLga.lgas) {
        let lga = await this.lga.findOne({ name: lgaName, stateId: state._id });
        if (!lga) lga = await this.lga.create({ name: lgaName, stateId: state._id });
      }
    }

    this.logger.log('Finished seeding states and LGAs!');
  }
}
