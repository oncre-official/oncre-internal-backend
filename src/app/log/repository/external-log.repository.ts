import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { ExternalLog, ExternalLogDocument } from '../model/external-log.model';

export class ExternalLogRepository extends BaseRepository<ExternalLogDocument> {
  constructor(@InjectModel(ExternalLog.name) private externalLogModel: Model<ExternalLogDocument>) {
    super(externalLogModel);
  }
}
