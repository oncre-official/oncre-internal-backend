import { Module } from '@nestjs/common';

import { LogModule } from '../log/log.module';
import { RoleModule } from '../role/role.module';
import { SharedModule } from '../shared/shared.module';
import { StaffModule } from '../staff/staff.module';
import { UserModule } from '../user/user.module';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [UserModule, RoleModule, LogModule, SharedModule, StaffModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
