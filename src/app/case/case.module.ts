import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NestjsFormDataModule } from 'nestjs-form-data';

import { TermiiService } from '@on/services/termii/service';

import { CustomerModule } from '../customer/customer.module';
import { LogModule } from '../log/log.module';
import { MerchantModule } from '../merchant/merchant.module';
import { RoleModule } from '../role/role.module';
import { SharedModule } from '../shared/shared.module';
import { StaffModule } from '../staff/staff.module';
import { UserModule } from '../user/user.module';

import { CaseController } from './case.controller';
import { CaseService } from './case.service';
import { Case, CaseSchema } from './model/case.model';
import { CaseRepository } from './repository/case.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Case.name, schema: CaseSchema }]),
    UserModule,
    RoleModule,
    SharedModule,
    MerchantModule,
    CustomerModule,
    LogModule,
    StaffModule,
    NestjsFormDataModule,
  ],
  controllers: [CaseController],
  providers: [CaseRepository, CaseService, TermiiService],
  exports: [CaseService, CaseRepository],
})
export class CaseModule {}
