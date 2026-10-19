import { User } from '@on/app/user/model/user.model';

export interface ISharedAuth {
  value: string;
}

export interface ILogin extends ISharedAuth {
  password: string;
}

export interface IResetPassword extends ISharedAuth {
  otp: string;
  newPassword: string;
}

export interface IVerifyOtp extends ISharedAuth {
  otp: string;
}

export interface IUserToken {
  user: User;
  token: string;
}
