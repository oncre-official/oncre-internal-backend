import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { LogRepository } from '@on/app/log/repository/log.repository';
import { Permission } from '@on/app/role/model/permission.model';
import { RoleRepository } from '@on/app/role/repository/role.repository';
import { UserDocument } from '@on/app/user/model/user.model';

import { BaseGuard } from './base.guard';

@Injectable()
export class PermissionGuard extends BaseGuard implements CanActivate {
  constructor(reflector: Reflector, role: RoleRepository, log: LogRepository) {
    super(reflector, role, log);
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user: UserDocument = request.user;

    const role = await this.role.findById(user.roleId, { populate: [{ path: 'permissions' }] });
    const userPermissions: string[] = role?.permissions?.map((permission: Permission) => permission.name) ?? [];

    const hasPermission = requiredPermissions.every((permission) => userPermissions.includes(permission));

    if (!hasPermission) {
      await this.deny(context, 'Missing required permission');
    }

    return true;
  }
}
