import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { Case, CaseDocument } from '../model/case.model';

export class CaseRepository extends BaseRepository<CaseDocument> {
  constructor(@InjectModel(Case.name) private caseModel: Model<CaseDocument>) {
    super(caseModel);
  }
}
