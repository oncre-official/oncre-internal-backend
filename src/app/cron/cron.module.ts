import { Module } from '@nestjs/common';

import { TermiiService } from '@on/services/termii/service';

import { CallModule } from '../call/call.module';

import { CaseModule } from './../case/case.module';
import { CallSchedulerService } from './services/call-scheduler.service';

@Module({
  imports: [CaseModule, CallModule],
  providers: [CallSchedulerService, TermiiService],
})
export class CronModule {}
