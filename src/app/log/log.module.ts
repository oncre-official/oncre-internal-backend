import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RoleModule } from '../role/role.module';

import { LogController } from './log.controller';
import { LogService } from './log.service';
import { AuditLog, AuditLogSchema } from './model/audit-log.model';
import { ExternalLog, ExternalLogSchema } from './model/external-log.model';
import { Log, LogSchema } from './model/log.model';
import { AuditLogRepository } from './repository/audit-log.repository';
import { ExternalLogRepository } from './repository/external-log.repository';
import { LogRepository } from './repository/log.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Log.name, schema: LogSchema },
      { name: AuditLog.name, schema: AuditLogSchema },
      { name: ExternalLog.name, schema: ExternalLogSchema },
    ]),
    RoleModule,
  ],
  controllers: [LogController],
  providers: [LogRepository, AuditLogRepository, ExternalLogRepository, LogService],
  exports: [LogRepository, AuditLogRepository, ExternalLogRepository, LogService],
})
export class LogModule {}
