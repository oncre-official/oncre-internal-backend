import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { RolePermission } from '../model/role-permission.model';

export class RolePermissionRepository extends BaseRepository<RolePermission> {
  constructor(@InjectModel(RolePermission.name) private rolePermissionModel: Model<RolePermission>) {
    super(rolePermissionModel);
  }
}
