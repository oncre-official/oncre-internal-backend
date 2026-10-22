import { ForbiddenException, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { LogRepository } from '@on/app/log/repository/log.repository';
import { RoleRepository } from '@on/app/role/repository/role.repository';
import { UserDocument } from '@on/app/user/model/user.model';

@Injectable()
export abstract class BaseGuard {
  constructor(
    protected readonly reflector: Reflector,
    protected readonly role: RoleRepository,
    protected readonly log: LogRepository,
  ) {}

  protected async deny(context: ExecutionContext, reason: string): Promise<never> {
    const request = context.switchToHttp().getRequest();
    const user = (request.user as UserDocument) || { _id: 'unknown' };

    const forwardedFor = request.headers['x-forwarded-for'] || request.headers['x-real-ip'];
    const ip = forwardedFor ? (forwardedFor as string).split(',')[0] : request.ip;

    await this.log
      .create({
        userId: user?._id,
        action: 'ACCESS_DENIED',
        route: request.originalUrl || request.url,
        method: request.method,
        reason,
        ip: ip || request.connection.remoteAddress,
        userAgent: request.headers['user-agent'],
        createdAt: new Date(),
      })
      .catch((error) => console.log(error));

    throw new ForbiddenException('You do not have permission to access this resource.');
  }
}
