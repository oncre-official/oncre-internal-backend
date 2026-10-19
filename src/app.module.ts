import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { AdminModule } from './app/admin/admin.module';
import { AuthModule } from './app/auth/auth.module';
import { CaseModule } from './app/case/case.module';
import { CustomerModule } from './app/customer/customer.module';
import { LogModule } from './app/log/log.module';
import { RoleModule } from './app/role/role.module';
import { SharedModule } from './app/shared/shared.module';
import { StaffModule } from './app/staff/staff.module';
import { UserModule } from './app/user/user.module';
import { AppController } from './app.controller';
import { config } from './config';
import { HttpExceptionFilter } from './handlers/exceptions/http-exception.filter';

@Module({
  imports: [
    MongooseModule.forRoot(config.db.url as string),
    SharedModule,
    LogModule,
    AuthModule,
    UserModule,
    RoleModule,
    AdminModule,
    CaseModule,
    StaffModule,
    CustomerModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    {
      useClass: HttpExceptionFilter,
      provide: APP_FILTER,
    },
  ],
})
export class AppModule {}
