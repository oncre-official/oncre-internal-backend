import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { Log, LogDocument } from '../model/log.model';

export class LogRepository extends BaseRepository<LogDocument> {
  constructor(@InjectModel(Log.name) private logModel: Model<LogDocument>) {
    super(logModel);
  }
}
