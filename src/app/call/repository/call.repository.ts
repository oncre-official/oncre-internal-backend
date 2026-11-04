import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { Call, CallDocument } from '../model/call.model';

export class CallRepository extends BaseRepository<CallDocument> {
  constructor(@InjectModel(Call.name) private callModel: Model<CallDocument>) {
    super(callModel);
  }
}
