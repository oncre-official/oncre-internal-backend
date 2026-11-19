import { ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';

import { UserStatus } from '@on/enum';
import { formatPhoneWithCode, parsePhone } from '@on/helpers/phone';
import { joinSearchQuery } from '@on/helpers/search';
import { buildUserLookupQuery } from '@on/helpers/user';
import { QueryDto } from '@on/utils/dto/query.dto';
import { ServiceResponse } from '@on/utils/types';

import { LogService } from '../log/log.service';
import { AuditAction, AuditModule } from '../log/type/audit-log.interface';
import { InstitutionKybService } from '../onboarding/institution-kyb.service';
import { RoleRepository } from '../role/repository/role.repository';
import { SharedService } from '../shared/shared.service';
import { User } from '../user/model/user.model';
import { UserRepository } from '../user/repository/user.repository';

import { CreateMerchantDto } from './dto/merchant.dto';
import { Merchant } from './model/merchant.model';
import { MerchantRepository } from './repository/merchant.repository';
import { MerchantStatus, MerchantType } from './types/index.interface';

const APPROVAL_REQUIRED_CHANNELS = ['sales', 'field-agent'];

@Injectable()
export class MerchantService {
  constructor(
    private readonly log: LogService,
    private readonly user: UserRepository,
    private readonly role: RoleRepository,
    private readonly shared: SharedService,
    private readonly merchant: MerchantRepository,
    @Inject(forwardRef(() => InstitutionKybService))
    private readonly institutionKyb: InstitutionKybService,
  ) {}

  async find(query: QueryDto, skip: number = 0, limit: number = 20): Promise<ServiceResponse<any>> {
    const { search } = query;

    const joinQuery = joinSearchQuery({
      search,
      fields: ['name', 'storeName', 'phone', 'email', 'location', 'product'],
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
      search: () => this.merchant.aggregateAndCount(joinQuery, { aggregate: { skip, limit } }),
      normal: () =>
        this.merchant.findAndCount(query, {
          aggregate: { skip, limit },
          populate: [{ path: 'user' }],
          sort: { createdAt: -1 },
        }),
    };

    const data = search ? await strategies.search() : await strategies.normal();

    return { data, message: 'Merchants successfully fetched' };
  }

  async create(creator: User, payload: CreateMerchantDto): Promise<ServiceResponse<Merchant | any>> {
    const { name, phone: phoneNumber, channel } = payload;

    const normalizedPhone = formatPhoneWithCode(phoneNumber);
    const { code, phone } = parsePhone(normalizedPhone);

    const role = await this.role.findOne({ name: 'merchant' });
    if (!role) throw new NotFoundException('Merchant role not found');

    const creatorRole = await this.role.findById(creator.roleId);
    if (!creatorRole) throw new NotFoundException('Creator role not found');

    const merchantExist = await this.merchant.findOne({ $or: [{ name }, { phone }] });
    if (merchantExist) throw new ConflictException('Merchant already exists');

    // Institutions pass KYB (CAC check) before anything is saved; a failure creates nothing.
    const isInstitution = payload.type === MerchantType.FINANCIAL_INSTITUTION;
    const kybCheck = isInstitution ? await this.institutionKyb.check(payload.institutionDetails) : undefined;
    if (kybCheck && !kybCheck.skipped && payload.institutionDetails && !payload.institutionDetails.legalName) {
      payload.institutionDetails.legalName = kybCheck.business.legalName;
    }

    const userLookup = buildUserLookupQuery(phoneNumber);
    const conditions = [userLookup];

    let user = await this.user.findOne({ $or: conditions });
    if (!user) {
      user = await this.user.create({
        countryCode: code,
        phone: phone,
        roleId: role.id,
        passwordChanged: false,
        phoneVerified: true,
        emailVerified: true,
        status: UserStatus.INACTIVE,
      });
    }

    const merchantId = await this.shared.generateSequentialId('merchantId', 'MER', 5);

    const merchantPayload = {
      ...payload,
      merchantId: merchantId,
      userId: user._id,
      createdBy: creator._id,
      channel: channel ?? creatorRole.name,
      status: APPROVAL_REQUIRED_CHANNELS.includes(creatorRole.name) ? MerchantStatus.PENDING : MerchantStatus.ACTIVE,
    };

    const merchant = await this.merchant.create(merchantPayload);

    // Sign-up is finished for a verified institution: it only has to log in (phone + SMS code).
    if (kybCheck) await this.institutionKyb.complete(user, merchant, kybCheck);

    await this.log.record(creator, {
      action: AuditAction.CREATE,
      module: AuditModule.MERCHANT,
      description: `Merchant ${merchant.name} (${merchant.merchantId}) created`,
      recordId: merchant._id,
      recordType: 'merchant',
      recordReference: merchant.merchantId,
      metadata: {
        merchantId: merchant.merchantId,
        userId: String(user._id),
        channel: merchant.channel,
        status: merchant.status,
        createdBy: String(creator._id),
      },
    });

    const data = { ...merchant.toObject() };

    return { data, message: `Merchant successfully created` };
  }

  async findById(id: string): Promise<ServiceResponse<Merchant>> {
    const merchant = await this.merchant.findById(id, { populate: [{ path: 'user' }, { path: 'creator' }] });
    if (!merchant) throw new NotFoundException('Merchant not found');

    return { data: merchant, message: 'Merchant successfully fetched' };
  }

  async deactivate(id: string): Promise<ServiceResponse<Merchant>> {
    const merchant = await this.merchant.findById(id);
    if (!merchant) throw new NotFoundException('Merchant not found');

    await merchant.updateOne({ status: MerchantStatus.IN_ACTIVE });

    return { data: merchant, message: 'Merchant deactivated successfully' };
  }

  async reject(id: string): Promise<ServiceResponse<Merchant>> {
    const merchant = await this.merchant.findById(id);
    if (!merchant) throw new NotFoundException('Merchant not found');

    const updated = await this.merchant.updateById(id, { approval_status: MerchantStatus.ACTIVE });

    return { data: updated, message: 'Merchant rejected successfully' };
  }
}
