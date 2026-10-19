import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { AuditLog, AuditLogDocument } from '../model/audit-log.model';

export class AuditLogRepository extends BaseRepository<AuditLogDocument> {
  constructor(@InjectModel(AuditLog.name) private logModel: Model<AuditLogDocument>) {
    super(logModel);
  }
}
