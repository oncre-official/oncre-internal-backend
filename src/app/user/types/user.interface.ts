import { ObjectId } from 'mongodb';

import { UserStatus } from '@on/enum';
import { IBaseType } from '@on/utils/types';

export interface IUser extends IBaseType {
  countryCode: string;
  phone: string;
  email: string;
  roleId: ObjectId;
  password: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  passwordChanged: boolean;
  status: UserStatus;
  lastLogin: Date;
}
