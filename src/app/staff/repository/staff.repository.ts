import { BadRequestException } from '@nestjs/common';
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

import { Staff, StaffDocument } from '../model/staff.model';
import { ICreateStaff } from '../types/index.interface';

export class StaffRepository extends BaseRepository<StaffDocument> {
  constructor(
    private readonly user: UserRepository,
    private readonly role: RoleRepository,
    private readonly shared: SharedService,
    @InjectModel(Staff.name) private staffModel: Model<StaffDocument>,
  ) {
    super(staffModel);
  }

  async findOrCreate(payload: ICreateStaff): Promise<StaffDocument | null> {
    const { phone: staffPhone, email: staffEmail, createdBy, supervisorId, ...others } = payload;

    const email = staffEmail?.trim().toLowerCase();
    const phone = staffPhone?.trim();

    if (!email && !phone) throw new BadRequestException('Staff email or phone number is required');

    let staffByEmail: StaffDocument | null = null;
    let staffByPhone: StaffDocument | null = null;

    if (email) staffByEmail = await this.staffModel.findOne({ email });
    if (phone) staffByPhone = await this.findByPhone(phone);

    if (staffByEmail && staffByPhone && !staffByEmail._id.equals(staffByPhone._id)) {
      throw new BadRequestException('Email and phone number belong to different staffs');
    }

    let staff = staffByEmail ?? staffByPhone;
    const userConditions: Record<string, any>[] = [];

    if (phone) userConditions.push(buildUserLookupQuery(phone));
    if (email) userConditions.push({ email });

    const userLookup = userConditions.length ? await this.user.findOne({ $or: userConditions }) : null;

    if (staff) {
      const updates: Record<string, any> = { ...others };

      if (email && !staff.email) updates.email = email;
      if (phone && !staff.phone) updates.phone = phone;

      if (!staff.userId) {
        let user = userLookup;

        if (!user) {
          const [, hashedPassword] = await generatePassword();

          const userPayload: Record<string, any> = {
            ...(email && { email }),
            ...(phone &&
              (() => {
                const normalizedPhone = formatPhoneWithCode(phone);
                const parsed = parsePhone(normalizedPhone);

                return { countryCode: parsed.code || '234', phone: parsed.phone };
              })()),
            password: hashedPassword,
            passwordChanged: false,
            phoneVerified: Boolean(phone),
            emailVerified: false,
            status: UserStatus.ACTIVE,
          };

          const role = await this.role.findOne({ name: 'staff' }).catch(() => null);
          if (role) userPayload.roleId = role._id;

          user = await this.user.create(userPayload);
        }

        updates.userId = user._id;
      }

      if (!staff.code) updates.code = await this.shared.generateSequentialId('staffId', 'AG', 5);
      if (Object.keys(updates).length)
        staff = await this.staffModel.findByIdAndUpdate(staff._id, updates, { new: true });

      return staff;
    }

    let user = userLookup;

    if (!user) {
      const [, hashedPassword] = await generatePassword();

      const userPayload: Record<string, any> = {
        ...(email && { email }),
        ...(phone &&
          (() => {
            const normalizedPhone = formatPhoneWithCode(phone);
            const parsed = parsePhone(normalizedPhone);

            return {
              countryCode: parsed.code,
              phone: parsed.phone,
            };
          })()),
        password: hashedPassword,
        passwordChanged: false,
        phoneVerified: Boolean(phone),
        emailVerified: false,
        status: UserStatus.ACTIVE,
      };

      const role = await this.role.findOne({ name: 'staff' }).catch(() => null);

      if (role) userPayload.roleId = role._id;

      user = await this.user.create(userPayload);
    }

    const code = await this.shared.generateSequentialId('staffId', 'AG', 5);

    return this.staffModel.create({
      ...others,
      ...(email && { email }),
      ...(phone && { phone }),
      code,
      userId: user._id,
      ...(createdBy && { createdBy }),
      supervisorId: supervisorId ?? createdBy,
    });
  }

  async findByPhone(phone: string): Promise<StaffDocument | null> {
    const suffix = phoneNationalDigits(phone);
    if (!suffix) return null;

    const regex = new RegExp(`${suffix}$`);

    return this.staffModel.findOne({ phone: regex });
  }
}
