import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { Counter, CounterDocument } from '../model/counter.model';

export class CounterRepository extends BaseRepository<CounterDocument> {
  constructor(
    @InjectModel(Counter.name) private counterModel: Model<CounterDocument>,
  ) {
    super(counterModel);
  }
}
