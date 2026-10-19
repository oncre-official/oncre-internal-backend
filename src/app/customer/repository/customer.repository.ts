import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RoleRepository } from '@on/app/role/repository/role.repository';
import { SharedService } from '@on/app/shared/shared.service';
import { UserRepository } from '@on/app/user/repository/user.repository';
import { UserStatus } from '@on/enum';
import { generatePassword } from '@on/helpers/password';
import { formatPhoneWithCode, parsePhone, phoneNationalDigits } from '@on/helpers/phone';
import { buildUserLookupQuery } from '@on/helpers/user';
import { BaseRepository } from '@on/repository/base.repository';

import { Customer, CustomerDocument } from '../model/customer.model';
import { ICreateCustomer } from '../types/customer.interface';

export class CustomerRepository extends BaseRepository<CustomerDocument> {
  constructor(
    private readonly user: UserRepository,
    private readonly role: RoleRepository,
    private readonly shared: SharedService,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
  ) {
    super(customerModel);
  }

  async findOrCreate(payload: ICreateCustomer): Promise<CustomerDocument | null> {
    const { phone: customerPhone, createdBy, ...others } = payload;

    console.log(payload);

    const userLookup = buildUserLookupQuery(customerPhone);
    const conditions = [userLookup];

    let customer: CustomerDocument | null = await this.customerModel.findOne({ phone: customerPhone });

    const normalizedPhone = formatPhoneWithCode(customerPhone);
    const { code, phone } = parsePhone(normalizedPhone);

    const role = await this.role.findOne({ name: 'customer' }).catch(() => null);

    if (customer) {
      if (!customer.userId) {
        let user = await this.user.findOne({ $or: conditions });

        if (!user) {
          const [, hashedPassword] = await generatePassword();

          user = await this.user.create({
            countryCode: code,
            phone,
            roleId: role?._id,
            password: hashedPassword,
            passwordChanged: false,
            phoneVerified: true,
            emailVerified: true,
            status: UserStatus.ACTIVE,
          });
        }

        customer = await this.customerModel.findByIdAndUpdate(customer._id, {
          userId: user._id,
          ...others,
        });
      }

      if (!customer?.customerId) {
        const customerId = await this.shared.generateSequentialId('customerId', 'CUS', 5);

        customer = await this.customerModel.findByIdAndUpdate(customer?._id, {
          customerId: customerId,
          ...others,
        });
      }

      return customer;
    }

    let user = await this.user.findOne({ $or: conditions });
    if (!user) {
      const [, hashedPassword] = await generatePassword();

      user = await this.user.create({
        countryCode: code,
        phone,
        roleId: role?._id,
        password: hashedPassword,
        passwordChanged: false,
        phoneVerified: true,
        emailVerified: true,
        status: UserStatus.ACTIVE,
      });
    }

    const customerId = await this.shared.generateSequentialId('customerId', 'CUS', 5);

    customer = await this.customerModel.create({
      ...payload,
      key: customerPhone,
      customerId: customerId,
      userId: user._id,
      ...(createdBy && { createdBy }),
    });

    return customer;
  }

  async findByPhone(phone: string): Promise<CustomerDocument | null> {
    const suffix = phoneNationalDigits(phone);
    if (!suffix) return null;

    const regex = new RegExp(`${suffix}$`);

    return this.customerModel.findOne({ phone: regex });
  }
}
