import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { MerchantOnboarding, MerchantOnboardingDocument } from '../model/merchant-onboarding.model';

export class MerchantOnboardingRepository extends BaseRepository<MerchantOnboardingDocument> {
  constructor(
    @InjectModel(MerchantOnboarding.name) private merchantOnboardingModel: Model<MerchantOnboardingDocument>,
  ) {
    super(merchantOnboardingModel);
  }
}
