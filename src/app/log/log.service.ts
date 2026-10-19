import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';

import { joinSearchQuery } from '@on/helpers/search';
import { QueryDto } from '@on/utils/dto/query.dto';
import { ServiceResponse } from '@on/utils/types';

import { User } from '../user/model/user.model';

import { AuditLog } from './model/audit-log.model';
import { AuditLogRepository } from './repository/audit-log.repository';
import { ExternalLogRepository } from './repository/external-log.repository';
import { LogRepository } from './repository/log.repository';
import { AuditStatus, CreateAuditLogPayload } from './type/audit-log.interface';
import { ExternalRequestStatus, IExternalLog, ILog, LogLevel } from './type/log.interface';

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);

  constructor(
    private readonly localLog: LogRepository,
    private readonly auditLog: AuditLogRepository,
    private readonly externalLog: ExternalLogRepository,
  ) {}

  async findAudit(query: QueryDto, skip: number = 0, limit: number = 20): Promise<ServiceResponse<any>> {
    const { search } = query;

    const joinQuery = joinSearchQuery({
      search,
      fields: [],
      query,
      joins: [],
    });

    const strategies = {
      search: () => this.auditLog.aggregateAndCount(joinQuery, { aggregate: { skip, limit } }),
      normal: () =>
        this.auditLog.findAndCount(query, {
          aggregate: { skip, limit },
          populate: [],
          sort: { createdAt: -1 },
        }),
    };

    const data = search ? await strategies.search() : await strategies.normal();

    return { data, message: 'AuditLogs successfully fetched' };
  }

  async findById(id: string): Promise<ServiceResponse<AuditLog>> {
    const auditLog = await this.auditLog.findById(id, { populate: [{ path: 'user' }, { path: 'creator' }] });
    if (!auditLog) throw new NotFoundException('AuditLog not found');

    return { data: auditLog, message: 'AuditLog successfully fetched' };
  }

  async log(payload: Partial<ILog>): Promise<ServiceResponse<string | null>> {
    try {
      const created = await this.localLog.create({
        level: LogLevel.INFO,
        ...payload,
      });

      return { data: created.id, message: 'Log created successfully' };
    } catch (error) {
      this.logger.error('Failed to save application log', error);

      return { data: null, message: 'Failed to create log' };
    }
  }

  async logExternal(payload: Partial<IExternalLog>): Promise<ServiceResponse<string | null>> {
    try {
      const created = await this.externalLog.create({
        status: ExternalRequestStatus.SUCCESS,
        ...payload,
      });

      return { data: created.id, message: 'External log created successfully' };
    } catch (error) {
      this.logger.error('Failed to save external request log', error);

      return { data: null, message: 'Failed to create external log' };
    }
  }

  async record(user: User, payload: CreateAuditLogPayload) {
    return this.auditLog.create({
      ...payload,
      userId: user?._id ? new ObjectId(String(user._id)) : undefined,
      status: payload.status ?? AuditStatus.SUCCESS,
      createdAt: new Date(),
    });
  }
}
