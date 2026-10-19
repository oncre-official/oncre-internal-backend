import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { Role, RoleDocument } from '../model/role.model';

export class RoleRepository extends BaseRepository<RoleDocument> {
  constructor(@InjectModel(Role.name) private roleModel: Model<RoleDocument>) {
    super(roleModel);
  }
}
