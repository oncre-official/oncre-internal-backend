import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { Permission, PermissionDocument } from '../model/permission.model';

export class PermissionRepository extends BaseRepository<PermissionDocument> {
  constructor(@InjectModel(Permission.name) private permissionModel: Model<PermissionDocument>) {
    super(permissionModel);
  }
}
