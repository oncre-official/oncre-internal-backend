import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LogModule } from '../log/log.module';
import { RoleModule } from '../role/role.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';

import { Staff, StaffSchema } from './model/staff.model';
import { StaffRepository } from './repository/staff.repository';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Staff.name, schema: StaffSchema }]),
    UserModule,
    RoleModule,
    SharedModule,
    LogModule,
  ],
  controllers: [StaffController],
  providers: [StaffRepository, StaffService],
  exports: [StaffRepository, StaffService],
})
export class StaffModule {}
