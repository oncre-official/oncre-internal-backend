import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { CloudinaryService } from '@on/services/cloudinary/service';
import { FlutterwaveService } from '@on/services/flutterwave/service';
import { PaystackService } from '@on/services/paystack/service';

import { LogModule } from '../log/log.module';

import { Counter, CounterSchema } from './model/counter.model';
import { Lga, LgaSchema } from './model/local-govt.model';
import { State, StateSchema } from './model/state.model';
import { CounterRepository } from './repository/counter.repository';
import { LgaRepository } from './repository/local-govt.repository';
import { StateRepository } from './repository/state.repository';
import { StateLgaSeeder } from './seeder/state-local.seeder';
import { SharedController } from './shared.controller';
import { SharedService } from './shared.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: State.name, schema: StateSchema },
      { name: Lga.name, schema: LgaSchema },
      { name: Counter.name, schema: CounterSchema },
    ]),
    LogModule,
    NestjsFormDataModule,
  ],
  controllers: [SharedController],
  providers: [
    StateRepository,
    LgaRepository,
    CounterRepository,
    SharedService,
    CloudinaryService,
    PaystackService,
    FlutterwaveService,
    StateLgaSeeder,
  ],
  exports: [StateRepository, LgaRepository, CounterRepository, SharedService],
})
export class SharedModule {}
