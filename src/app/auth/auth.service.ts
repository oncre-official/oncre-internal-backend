import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { TokenType } from '@on/enum';
import { compareResource, hashResource } from '@on/helpers/password';
import { buildUserLookupQuery } from '@on/helpers/user';
import { ServiceResponse } from '@on/utils/types';

import { TokenRepository } from '../user/repository/token.repository';
import { UserRepository } from '../user/repository/user.repository';

import { UserService } from './../user/user.service';
import { LoginDto, ResetPasswordDto, SharedAuthDto } from './dto/auth.dto';
import { IUserToken } from './types/auth.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly jwt: JwtService,
    private readonly user: UserRepository,
    private readonly token: TokenRepository,
    private readonly userService: UserService,
  ) {}

  public async signin(payload: LoginDto): Promise<ServiceResponse<IUserToken>> {
    const { value, password } = payload;

    const userLookup = buildUserLookupQuery(value);
    const conditions = [userLookup];

    const user = await this.user.findOne({ $or: conditions }, { populate: [{ path: 'role' }] });
    if (!user) throw new NotFoundException('User with this phone number or email does not exist.');

    const isValidPassword: boolean = await compareResource(password, user.password);
    if (!isValidPassword) throw new BadRequestException('Incorrect password provided');

    const jwt = this.jwt.sign({ ...user.toJSON() });
    this.logger.log('A user has logged in');

    const data = {
      user,
      token: jwt,
    };

    return { data, message: 'User login successfully.' };
  }

  public async forgetPassword(payload: SharedAuthDto): Promise<ServiceResponse<any>> {
    const { value } = payload;

    const userLookup = buildUserLookupQuery(value);
    const conditions = [userLookup];

    const user = await this.user.findOne({ $or: conditions });
    if (!user) throw new NotFoundException('User with this phone number or email does not exist.');

    const otp = await this.userService.createVerificationOtp(user, TokenType.PASSWORD_RESET);

    const data = {
      userId: user._id,
      otp,
    };

    return { data, message: 'OTP sent for Password reset.' };
  }

  public async resetPassword(payload: ResetPasswordDto): Promise<ServiceResponse<IUserToken>> {
    const { newPassword, otp, value } = payload;

    const userLookup = buildUserLookupQuery(value);
    const conditions = [userLookup];

    const user = await this.user.findOne({ $or: conditions });
    if (!user) throw new NotFoundException('User with this phone number or email does not exist.');

    const token = await this.token.findOne({ type: TokenType.PASSWORD_RESET, token: otp });
    if (!token) throw new BadRequestException('Invalid OTP code.');

    if (String(token.userId) !== String(user._id)) throw new BadRequestException('Invalid user OTP.');
    if (token.expiresAt < new Date()) throw new BadRequestException('OTP has expired. Please request a new one.');

    const hash = await hashResource(newPassword);

    await this.user.updateById(user._id, { password: hash, passwordChanged: true });
    await token.deleteOne();

    const jwt = this.jwt.sign(user.toJSON());

    const data = {
      user,
      token: jwt,
    };

    return { data, message: 'Password reset successfully.' };
  }
}
