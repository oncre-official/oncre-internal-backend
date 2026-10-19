import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';

import { UserStatus } from '@on/enum';
import { generatePassword } from '@on/helpers/password';
import { formatPhoneWithCode, parsePhone } from '@on/helpers/phone';
import { joinSearchQuery } from '@on/helpers/search';
import { buildUserLookupQuery } from '@on/helpers/user';
import { QueryDto } from '@on/utils/dto/query.dto';
import { ServiceResponse } from '@on/utils/types';

import { RoleRepository } from '../role/repository/role.repository';
import { SharedService } from '../shared/shared.service';
import { User } from '../user/model/user.model';
import { UserRepository } from '../user/repository/user.repository';

import { CreateStaffDto } from './dto/staff.dto';
import { Staff } from './model/staff.model';
import { StaffRepository } from './repository/staff.repository';
import { StaffStatus } from './types/index.interface';

@Injectable()
export class StaffService {
  constructor(
    private readonly user: UserRepository,
    private readonly role: RoleRepository,
    private readonly shared: SharedService,
    private readonly staff: StaffRepository,
  ) {}

  async find(query: QueryDto, skip: number = 0, limit: number = 20): Promise<ServiceResponse<any>> {
    const { search } = query;

    const joinQuery = joinSearchQuery({
      search,
      fields: ['firstName', 'lastName', 'phone'],
      query,
      joins: [],
    });

    const strategies = {
      search: () => this.staff.aggregateAndCount(joinQuery, { aggregate: { skip, limit } }),
      normal: () =>
        this.staff.findAndCount(query, {
          aggregate: { skip, limit },
          populate: [{ path: 'user' }],
          sort: { createdAt: -1 },
        }),
    };

    const data = search ? await strategies.search() : await strategies.normal();

    return { data, message: 'Staffs successfully fetched' };
  }

  async create(creator: User, payload: CreateStaffDto): Promise<ServiceResponse<Staff | any>> {
    const { phone: staffPhone, roleId } = payload;

    const normalizedPhone = formatPhoneWithCode(staffPhone);
    const { code, phone } = parsePhone(normalizedPhone);

    const role = await this.role.findById(roleId);
    if (!role) throw new NotFoundException('Staff role not found');

    const staffExist = await this.staff.findOne({ staff_key: staffPhone });
    if (staffExist) throw new ConflictException('Staff already exists');

    const userLookup = buildUserLookupQuery(staffPhone);
    const conditions = [userLookup];

    const [password, hashedPassword] = await generatePassword();

    let user = await this.user.findOne({ $or: conditions });
    if (!user) {
      user = await this.user.create({
        countryCode: code,
        phone: phone,
        roleId: role._id,
        password: hashedPassword,
        passwordChanged: false,
        phoneVerified: true,
        emailVerified: true,
        status: UserStatus.ACTIVE,
      });
    }

    const staffId = await this.shared.generateSequentialId('staffId', 'CUS', 5);

    const staffPayload = {
      ...payload,
      staffId: staffId,
      key: staffPhone,
      userId: user._id,
      createdBy: creator._id,
    };

    const staff = await this.staff.create(staffPayload);

    const data = { ...staff.toObject(), password };

    return { data, message: `Staff successfully created` };
  }

  async findById(id: string): Promise<ServiceResponse<Staff>> {
    const staff = await this.staff.findById(id, { populate: [{ path: 'user' }, { path: 'creator' }] });
    if (!staff) throw new NotFoundException('Staff not found');

    return { data: staff, message: 'Staff successfully fetched' };
  }

  async deactivate(id: string): Promise<ServiceResponse<Staff>> {
    const staff = await this.staff.findById(id);
    if (!staff) throw new NotFoundException('Staff not found');

    const updated = await this.staff.updateById(id, { status: StaffStatus.SUSPENDED });

    return { data: updated, message: 'Staff deactivated successfully' };
  }
}
