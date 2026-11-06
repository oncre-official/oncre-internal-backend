import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';

import { AdminModule } from './app/admin/admin.module';
import { AuthModule } from './app/auth/auth.module';
import { CallModule } from './app/call/call.module';
import { CaseModule } from './app/case/case.module';
import { CronModule } from './app/cron/cron.module';
import { CustomerModule } from './app/customer/customer.module';
import { LogModule } from './app/log/log.module';
import { MessageModule } from './app/message/message.module';
import { RoleModule } from './app/role/role.module';
import { SharedModule } from './app/shared/shared.module';
import { StaffModule } from './app/staff/staff.module';
import { TaskModule } from './app/task/task.module';
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
    CallModule,
    MessageModule,
    StaffModule,
    CustomerModule,
    CronModule,
    TaskModule,
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
