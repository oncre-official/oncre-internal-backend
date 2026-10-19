import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LogModule } from '../log/log.module';
import { RoleModule } from '../role/role.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';

import { MerchantController } from './merchant.controller';
import { MerchantService } from './merchant.service';
import { Merchant, MerchantSchema } from './model/merchant.model';
import { MerchantRepository } from './repository/merchant.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Merchant.name, schema: MerchantSchema }]),
    UserModule,
    RoleModule,
    SharedModule,
    LogModule,
  ],
  controllers: [MerchantController],
  providers: [MerchantRepository, MerchantService, MerchantRepository],
  exports: [MerchantRepository, MerchantService, MerchantRepository],
})
export class MerchantModule {}
