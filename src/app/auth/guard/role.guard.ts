import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { LogRepository } from '@on/app/log/repository/log.repository';
import { RoleRepository } from '@on/app/role/repository/role.repository';
import { UserDocument } from '@on/app/user/model/user.model';

import { BaseGuard } from './base.guard';

@Injectable()
export class RoleGuard extends BaseGuard implements CanActivate {
  constructor(reflector: Reflector, role: RoleRepository, log: LogRepository) {
    super(reflector, role, log);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user: UserDocument = request.user;

    const role = await this.role.findById(user.roleId);
    if (!role || !requiredRoles.includes(role.name)) {
      await this.deny(context, 'Missing required role');
    }

    return true;
  }
}
