import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { generatePassword } from '@on/helpers/password';
import { buildUserLookupQueryFromPayload } from '@on/helpers/user';
import { ServiceResponse } from '@on/utils/types';

import { Role } from '../role/model/role.model';
import { PermissionRepository } from '../role/repository/permission.repository';
import { RolePermissionRepository } from '../role/repository/role-permission.repository';
import { RoleRepository } from '../role/repository/role.repository';
import { StaffRepository } from '../staff/repository/staff.repository';
import { User } from '../user/model/user.model';
import { UserRepository } from '../user/repository/user.repository';

import { AdminCreateUserDto, AdminUpdateUserDto } from './dto/create-user.dto';
import { RolePermissionsDto } from './dto/permission.dto';
import { QueryUserDto } from './dto/query.dto';
import { CreateRoleDto, UpdateRoleDto } from './dto/role.dto';
import { UpdateUserRoleDto } from './dto/user-role.dto';

@Injectable()
export class AdminService {
  constructor(
    private readonly user: UserRepository,
    private readonly role: RoleRepository,
    private readonly staff: StaffRepository,
    private readonly permission: PermissionRepository,
    private readonly rolePermission: RolePermissionRepository,
  ) {}

  /**
   * USER SECTION
   */

  async findUser(query: QueryUserDto, skip: number = 0, limit: number = 20): Promise<ServiceResponse<any>> {
    const data = await this.user.findAndCount(query, {
      aggregate: { skip, limit },
      populate: [{ path: 'role' }],
      sort: { createdAt: -1 },
    });

    return { data, message: `User successfully fetched` };
  }

  async createUser(creator: User, payload: AdminCreateUserDto): Promise<ServiceResponse<User | any>> {
    const { roleId, phone, countryCode, email, ...others } = payload;

    const role = await this.role.findById(roleId);
    if (!role) throw new NotFoundException('Role not found');

    const query = buildUserLookupQueryFromPayload({ phone, countryCode, email });

    const userExists = await this.user.findOne(query);
    if (userExists) throw new ConflictException('User with this phone or email already exists');

    const [password, hashedPassword] = await generatePassword();

    const user = await this.user.create({
      ...payload,
      password: hashedPassword,
      passwordChanged: false,
      phoneVerified: true,
      emailVerified: true,
    });

    const repository = this.profile(role.name);

    await repository.create({
      ...others,
      userId: user._id,
      createdBy: creator._id,
    });

    const data = { ...user.toObject(), password };

    return { data, message: `User successfully created` };
  }

  async updateUser(id: string, payload: AdminUpdateUserDto): Promise<ServiceResponse<User>> {
    const { roleId } = payload;

    if (roleId) {
      const role = await this.role.findById(roleId);
      if (!role) throw new NotFoundException('Role not found');
    }

    const user = await this.user.updateById(id, payload, { new: true });
    if (!user) throw new NotFoundException('User not found');

    return { data: user, message: `User successfully updated` };
  }

  async deleteUser(id: string): Promise<ServiceResponse<null>> {
    const user = await this.user.findById(id);
    if (!user) throw new NotFoundException('User not found');

    await this.user.deleteById(id);

    return { data: null, message: `User successfully deleted` };
  }

  /**
   * USER ROLE SECTION
   */

  async updateUserRole(userId: string, payload: UpdateUserRoleDto): Promise<ServiceResponse<User>> {
    const { roleId, remove } = payload;

    const user = await this.user.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    let role: Role;

    if (remove) {
      role = await this.role.findOne({ name: 'customer' });
      if (!role) throw new NotFoundException('Default role not found');
    } else {
      if (!roleId) throw new BadRequestException('roleId is required when assigning a role');

      role = await this.role.findById(roleId);
      if (!role) throw new NotFoundException('Role not found');
    }

    await this.user.updateOne({ _id: user._id }, { roleId: role._id });

    const updatedUser = await this.user.findById(user._id);

    return {
      data: updatedUser,
      message: remove ? 'User role removed successfully' : 'User role assigned successfully',
    };
  }

  /**
   * ROLE SECTION
   */

  async createRole(payload: CreateRoleDto): Promise<ServiceResponse<Role>> {
    const { name, description } = payload;

    const existing = await this.role.findOne({ name: name.trim() });
    if (existing) throw new ConflictException('Role already exists');

    const role = await this.role.create({
      name: name.trim(),
      description: description?.trim(),
    });

    return { data: role, message: 'Role created successfully' };
  }

  async updateRole(roleId: string, payload: UpdateRoleDto): Promise<ServiceResponse<Role>> {
    const role = await this.role.findById(roleId);
    if (!role) throw new NotFoundException('Role not found');

    const { name, description } = payload;

    if (name !== undefined) {
      const existingRole = await this.role.findOne({ name: name.trim(), _id: { $ne: role._id } });
      if (existingRole) throw new ConflictException('Role already exists');
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();

    await role.updateOne(updateData);

    return { data: role, message: 'Role updated successfully' };
  }

  async deleteRole(roleId: string): Promise<ServiceResponse<null>> {
    const role = await this.role.findById(roleId);
    if (!role) throw new NotFoundException('Role not found');

    const assignedUser = await this.user.findOne({ roleId: role._id });
    if (assignedUser)
      throw new BadRequestException('Role cannot be deleted because it is assigned to one or more users');

    await this.rolePermission.deleteMany({ roleId: roleId });
    await this.role.deleteOne({ _id: role._id });

    return { data: null, message: 'Role deleted successfully' };
  }

  /**
   * PERMISSION SECTION
   */

  async assignRolePermissions(roleId: string, payload: RolePermissionsDto): Promise<ServiceResponse<null>> {
    const role = await this.role.findById(roleId);
    if (!role) throw new NotFoundException('Role not found');

    const permissionIds = [...new Set(payload.permissionIds)];

    const permissions = await this.permission.find({ _id: { $in: permissionIds } });
    if (permissions.length !== permissionIds.length) throw new NotFoundException('One or more permissions not found');

    const existing = await this.rolePermission.find({ roleId, permissionId: { $in: permissionIds } });

    const existingPermissionIds = new Set(existing.map((item) => item.permissionId.toString()));

    const newPermissions = permissionIds
      .filter((permissionId) => !existingPermissionIds.has(permissionId))
      .map((permissionId) => ({ roleId, permissionId: permissionId }));

    if (newPermissions.length) await this.rolePermission.createMany(newPermissions);

    return { data: null, message: 'Permissions assigned successfully' };
  }

  async removeRolePermissions(roleId: string, payload: RolePermissionsDto): Promise<ServiceResponse<null>> {
    const role = await this.role.findById(roleId);
    if (!role) throw new NotFoundException('Role not found');

    const permissionIds = [...new Set(payload.permissionIds)];

    const permissions = await this.permission.find({ _id: { $in: permissionIds } });
    if (permissions.length !== permissionIds.length) throw new NotFoundException('One or more permissions not found');

    await this.rolePermission.deleteMany({ roleId, permissionId: { $in: permissionIds } });

    return { data: null, message: 'Permissions removed successfully' };
  }

  /**
   * PRIVATE METHOD
   */
  private profile(role: string) {
    const repositories = {
      staff: this.staff,
    };

    const repository = repositories[role.toLowerCase()];
    if (!repository) throw new BadRequestException(`No repository configured for role: ${role}`);

    return repository;
  }
}
