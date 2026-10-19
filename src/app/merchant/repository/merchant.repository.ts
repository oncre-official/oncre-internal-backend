import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { RoleRepository } from '@on/app/role/repository/role.repository';
import { SharedService } from '@on/app/shared/shared.service';
import { UserRepository } from '@on/app/user/repository/user.repository';
import { UserStatus } from '@on/enum';
import { escapeRegex } from '@on/helpers';
import { generatePassword } from '@on/helpers/password';
import { formatPhoneWithCode, parsePhone } from '@on/helpers/phone';
import { buildUserLookupQuery } from '@on/helpers/user';
import { BaseRepository } from '@on/repository/base.repository';

import { Merchant, MerchantDocument } from '../model/merchant.model';
import { MerchantChannel } from '../types/index.interface';
import { ICreateMerchant } from '../types/merchant.interface';

export class MerchantRepository extends BaseRepository<MerchantDocument> {
  constructor(
    private readonly user: UserRepository,
    private readonly role: RoleRepository,
    private readonly shared: SharedService,
    @InjectModel(Merchant.name) private merchantModel: Model<MerchantDocument>,
  ) {
    super(merchantModel);
  }

  async findOrCreate(payload: ICreateMerchant): Promise<MerchantDocument | null> {
    const { name, phone: merchantPhone, createdBy, ...others } = payload;

    const normalizedName = name.trim();
    const merchantRegex = { $regex: `^${escapeRegex(normalizedName)}$`, $options: 'i' };

    const userLookup = buildUserLookupQuery(merchantPhone);
    const conditions = [userLookup];

    let merchant: MerchantDocument | null = await this.merchantModel.findOne({ name: merchantRegex });

    const normalizedPhone = formatPhoneWithCode(merchantPhone);
    const { code, phone } = parsePhone(normalizedPhone);

    const role = await this.role.findOne({ name: 'merchant' }).catch(() => null);

    if (merchant) {
      if (!merchant.userId) {
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

        merchant = await this.merchantModel.findByIdAndUpdate(merchant._id, {
          userId: user._id,
          ...others,
        });
      }

      return merchant;
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

    const merchantId = await this.shared.generateSequentialId('merchantId', 'MER', 5);

    merchant = await this.merchantModel.create({
      ...payload,
      merchantId: merchantId,
      userId: user._id,
      ...(createdBy && { createdBy }),
      channel: payload.channel || MerchantChannel.MERCHANT_PORTAL,
    });

    return merchant;
  }
}
