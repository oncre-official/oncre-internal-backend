import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { MerchantKyc, MerchantKycDocument } from '../model/merchant-kyc.model';

export class MerchantKycRepository extends BaseRepository<MerchantKycDocument> {
  constructor(@InjectModel(MerchantKyc.name) private merchantKycModel: Model<MerchantKycDocument>) {
    super(merchantKycModel);
  }
}
