import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

import { PermissionDocument } from '../model/permission.model';
import { PermissionRepository } from '../repository/permission.repository';
import { RolePermissionRepository } from '../repository/role-permission.repository';
import { RoleRepository } from '../repository/role.repository';

import { permissions, roles } from './data';

@Injectable()
export class RolePermissionSeeder implements OnModuleInit {
  private readonly logger = new Logger(RolePermissionSeeder.name);

  constructor(
    private readonly role: RoleRepository,
    private readonly permission: PermissionRepository,
    private readonly rolePermission: RolePermissionRepository,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    this.logger.log('Seeding roles & permissions...');

    const permissionMap = new Map<string, PermissionDocument>();

    for (const permission of permissions) {
      let existingPermission = await this.permission.findOne({ name: permission.name });

      if (!existingPermission) {
        existingPermission = await this.permission.create(permission);
        this.logger.log(`Created permission: ${permission.name}`);
      }

      permissionMap.set(permission.name, existingPermission);
    }

    for (const roleData of roles) {
      let role = await this.role.findOne({ name: roleData.name });

      if (!role) {
        role = await this.role.create({ name: roleData.name });
        this.logger.log(`Created role: ${role.name}`);
      }

      for (const permissionName of roleData.permissions) {
        const permission = permissionMap.get(permissionName);

        if (!permission) continue;

        const existingRolePermission = await this.rolePermission.findOne({
          roleId: role._id,
          permissionId: permission._id,
        });

        if (!existingRolePermission) {
          await this.rolePermission.create({ roleId: role._id, permissionId: permission._id });
          this.logger.log(`Attached ${permission.name} -> ${role.name}`);
        }
      }
    }

    this.logger.log('Roles & permissions seeded successfully');
  }
}
