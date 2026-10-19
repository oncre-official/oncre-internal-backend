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

import { CreateCustomerDto } from './dto/customer.dto';
import { Customer } from './model/customer.model';
import { CustomerRepository } from './repository/customer.repository';
import { CustomerStatus } from './types/customer.interface';

@Injectable()
export class CustomerService {
  constructor(
    private readonly user: UserRepository,
    private readonly role: RoleRepository,
    private readonly shared: SharedService,
    private readonly customer: CustomerRepository,
  ) {}

  async find(query: QueryDto, skip: number = 0, limit: number = 20): Promise<ServiceResponse<any>> {
    const { search } = query;

    const joinQuery = joinSearchQuery({
      search,
      fields: ['name', 'phone', 'businessName'],
      query,
      joins: [
        {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
          searchFields: ['email', 'phone'],
        },
      ],
    });

    const strategies = {
      search: () => this.customer.aggregateAndCount(joinQuery, { aggregate: { skip, limit } }),
      normal: () =>
        this.customer.findAndCount(query, {
          aggregate: { skip, limit },
          populate: [{ path: 'user' }],
          sort: { createdAt: -1 },
        }),
    };

    const data = search ? await strategies.search() : await strategies.normal();

    return { data, message: 'Customers successfully fetched' };
  }

  async create(creator: User, payload: CreateCustomerDto): Promise<ServiceResponse<Customer | any>> {
    const { phone: customerPhone } = payload;

    const normalizedPhone = formatPhoneWithCode(customerPhone);
    const { code, phone } = parsePhone(normalizedPhone);

    const role = await this.role.findOne({ name: 'customer' });
    if (!role) throw new NotFoundException('Customer role not found');

    const customerExist = await this.customer.findOne({ customer_key: customerPhone });
    if (customerExist) throw new ConflictException('Customer already exists');

    const userLookup = buildUserLookupQuery(customerPhone);
    const conditions = [userLookup];

    const [password, hashedPassword] = await generatePassword();

    let user = await this.user.findOne({ $or: conditions });
    if (!user) {
      user = await this.user.create({
        countryCode: code,
        phone: phone,
        roleId: role.id,
        password: hashedPassword,
        passwordChanged: false,
        phoneVerified: true,
        emailVerified: true,
        status: UserStatus.ACTIVE,
      });
    }

    const customerId = await this.shared.generateSequentialId('customerId', 'CUS', 5);

    const customerPayload = {
      ...payload,
      customerId: customerId,
      key: customerPhone,
      userId: user._id,
      createdBy: creator._id,
    };

    const customer = await this.customer.create(customerPayload);

    const data = { ...customer.toObject(), password };

    return { data, message: `Customer successfully created` };
  }

  async findById(id: string): Promise<ServiceResponse<Customer>> {
    const customer = await this.customer.findById(id, { populate: [{ path: 'user' }, { path: 'creator' }] });
    if (!customer) throw new NotFoundException('Customer not found');

    return { data: customer, message: 'Customer successfully fetched' };
  }

  async deactivate(id: string): Promise<ServiceResponse<Customer>> {
    const customer = await this.customer.findById(id);
    if (!customer) throw new NotFoundException('Customer not found');

    const updated = await this.customer.updateById(id, { status: CustomerStatus.INACTIVE });

    return { data: updated, message: 'Customer deactivated successfully' };
  }
}
