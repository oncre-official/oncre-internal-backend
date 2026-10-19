import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Permission, PermissionSchema } from './model/permission.model';
import { RolePermission, RolePermissionSchema } from './model/role-permission.model';
import { Role, RoleSchema } from './model/role.model';
import { PermissionRepository } from './repository/permission.repository';
import { RolePermissionRepository } from './repository/role-permission.repository';
import { RoleRepository } from './repository/role.repository';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';
import { RolePermissionSeeder } from './seeder/seeder';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
      { name: RolePermission.name, schema: RolePermissionSchema },
    ]),
  ],
  controllers: [RoleController],
  providers: [
    RoleRepository,
    RoleService,
    RolePermissionSeeder,
    RoleRepository,
    PermissionRepository,
    RolePermissionRepository,
  ],
  exports: [RoleRepository, RoleService, RoleRepository, PermissionRepository, RolePermissionRepository],
})
export class RoleModule {}
