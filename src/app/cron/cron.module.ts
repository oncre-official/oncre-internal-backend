import { Module } from '@nestjs/common';

import { TermiiService } from '@on/services/termii/service';

import { CallModule } from '../call/call.module';
import { MessageModule } from '../message/message.module';

import { CaseModule } from './../case/case.module';
import { SchedulerService } from './services/scheduler.service';

@Module({
  imports: [CaseModule, CallModule, MessageModule],
  providers: [SchedulerService, TermiiService],
})
export class CronModule {}
