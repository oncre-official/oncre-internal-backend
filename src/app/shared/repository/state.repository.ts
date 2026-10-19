import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { State, StateDocument } from '../model/state.model';

export class StateRepository extends BaseRepository<StateDocument> {
  constructor(@InjectModel(State.name) private stateModel: Model<StateDocument>) {
    super(stateModel);
  }
}
