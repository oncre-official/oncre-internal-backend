import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { KycModule } from '@on/services/kyc/module';
import { SmsModule } from '@on/services/sms/module';

import { MerchantModule } from '../merchant/merchant.module';
import { RoleModule } from '../role/role.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';

import { OnboardingGuard } from './guard/onboarding.guard';
import { MerchantKyc, MerchantKycSchema } from './model/merchant-kyc.model';
import { MerchantOnboarding, MerchantOnboardingSchema } from './model/merchant-onboarding.model';
import { MerchantKycController, MerchantSignupController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OtpService } from './otp.service';
import { MerchantKycRepository } from './repository/merchant-kyc.repository';
import { MerchantOnboardingRepository } from './repository/merchant-onboarding.repository';
import { MerchantSessionService } from './session.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: MerchantOnboarding.name, schema: MerchantOnboardingSchema },
      { name: MerchantKyc.name, schema: MerchantKycSchema },
    ]),
    UserModule,
    RoleModule,
    MerchantModule,
    SharedModule,
    SmsModule,
    KycModule,
  ],
  controllers: [MerchantSignupController, MerchantKycController],
  providers: [
    OnboardingService,
    OtpService,
    MerchantSessionService,
    MerchantOnboardingRepository,
    MerchantKycRepository,
    OnboardingGuard,
  ],
  exports: [OnboardingService, OtpService, MerchantSessionService],
})
export class OnboardingModule {}
