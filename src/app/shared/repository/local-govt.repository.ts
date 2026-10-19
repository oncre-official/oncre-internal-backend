import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { Lga, LgaDocument } from '../model/local-govt.model';

export class LgaRepository extends BaseRepository<LgaDocument> {
  constructor(@InjectModel(Lga.name) private lgaModel: Model<LgaDocument>) {
    super(lgaModel);
  }
}
