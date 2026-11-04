import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TermiiService } from '@on/services/termii/service';

import { LogModule } from '../log/log.module';
import { RoleModule } from '../role/role.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';

import { CallController } from './call.controller';
import { CallService } from './call.service';
import { Call, CallSchema } from './model/call.model';
import { CallRepository } from './repository/call.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Call.name, schema: CallSchema }]),
    UserModule,
    LogModule,
    RoleModule,
    SharedModule,
  ],
  controllers: [CallController],
  providers: [CallRepository, CallService, TermiiService, CallRepository],
  exports: [CallRepository, CallService, CallRepository],
})
export class CallModule {}
