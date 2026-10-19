import { Injectable } from '@nestjs/common';

import { ServiceResponse } from '@on/utils/types';

import { Role } from './model/role.model';
import { RoleRepository } from './repository/role.repository';

@Injectable()
export class RoleService {
  constructor(private readonly role: RoleRepository) {}

  async find(): Promise<ServiceResponse<Role[]>> {
    const options = {
      populate: [{ path: 'permissions' }],
    };

    const data = await this.role.find({}, options);

    return { data, message: 'roles successfully fetched' };
  }
}
