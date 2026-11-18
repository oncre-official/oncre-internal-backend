import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { User } from '@on/app/user/model/user.model';
import { TokenRepository } from '@on/app/user/repository/token.repository';
import { TokenType } from '@on/enum';
import { SmsService } from '@on/services/sms/service';

import {
  assertNotLocked,
  generateOtp,
  hashOtp,
  INVALID_CODE,
  OTP_LOCK_MINUTES,
  OTP_MAX_FAILED_ATTEMPTS,
  OTP_MAX_SENDS_PER_HOUR,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
  safeEqual,
} from './helpers';
import { MerchantOnboardingDocument } from './model/merchant-onboarding.model';
import { MerchantOnboardingRepository } from './repository/merchant-onboarding.repository';
import { OtpPurpose } from './types/otp.interface';

const MESSAGES: Record<OtpPurpose, (otp: string, minutes: number) => string> = {
  [OtpPurpose.SIGNUP]: (otp, minutes) =>
    `Your OnCRE verification code is ${otp}. It expires in ${minutes} minutes. Do not share it with anyone.`,
  [OtpPurpose.LOGIN]: (otp, minutes) =>
    `Your OnCRE login code is ${otp}. It expires in ${minutes} minutes. Do not share it with anyone.`,
};

/**
 * Everything about phone codes in one place: generating, hashing, sending, checking and the limits
 * (one a minute, five an hour, 30-minute lock after five wrong codes). Sign-up and login both use it,
 * so a change of SMS provider, code length or limits happens here only.
 */
@Injectable()
export class OtpService {
  constructor(
    private readonly onboarding: MerchantOnboardingRepository,
    private readonly token: TokenRepository,
    private readonly sms: SmsService,
  ) {}

  async send(user: User, progress: MerchantOnboardingDocument, purpose: OtpPurpose): Promise<number> {
    const now = new Date();

    assertNotLocked(progress.otpLockedUntil, 'Too many wrong codes.');

    if (progress.lastOtpSentAt) {
      const waitSeconds = Math.ceil(
        OTP_RESEND_COOLDOWN_SECONDS - (now.getTime() - progress.lastOtpSentAt.getTime()) / 1000,
      );
      if (waitSeconds > 0) {
        throw new HttpException(
          `Please wait ${waitSeconds} seconds before requesting a new code.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const windowExpired =
      !progress.otpWindowStartedAt || now.getTime() - progress.otpWindowStartedAt.getTime() > 60 * 60 * 1000;
    const sendCount = windowExpired ? 0 : progress.otpSendCount;

    if (sendCount >= OTP_MAX_SENDS_PER_HOUR) {
      throw new HttpException('Too many codes requested. Please try again in an hour.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const otp = generateOtp();

    await this.token.deleteMany({ userId: user._id, type: TokenType.PHONE_VERIFICATION });
    await this.token.create({
      userId: user._id,
      type: TokenType.PHONE_VERIFICATION,
      token: hashOtp(otp),
      expiresAt: new Date(now.getTime() + OTP_TTL_SECONDS * 1000),
    });

    await this.sms.send(`${user.countryCode}${user.phone}`, MESSAGES[purpose](otp, OTP_TTL_SECONDS / 60));

    await this.onboarding.updateOne(
      { _id: progress._id },
      {
        $set: {
          lastOtpSentAt: now,
          otpSendCount: sendCount + 1,
          ...(windowExpired ? { otpWindowStartedAt: now } : {}),
        },
      },
    );

    return OTP_TTL_SECONDS;
  }

  /** Checks the code and deletes it, so each code works once. A wrong code counts towards the lock. */
  async consume(user: User, progress: MerchantOnboardingDocument, otp: string): Promise<void> {
    assertNotLocked(progress.otpLockedUntil, 'Too many wrong codes.');

    const token = await this.token.findOne({ userId: user._id, type: TokenType.PHONE_VERIFICATION });
    const isValid = Boolean(token) && token.expiresAt > new Date() && safeEqual(hashOtp(otp), token.token);

    if (!isValid) {
      await this.recordFailure(user, progress);
      throw new BadRequestException(INVALID_CODE);
    }

    await this.token.deleteMany({ userId: user._id, type: TokenType.PHONE_VERIFICATION });
    await this.onboarding.updateOne(
      { _id: progress._id },
      { $set: { otpFailedAttempts: 0 }, $unset: { otpLockedUntil: 1 } },
    );
  }

  private async recordFailure(user: User, progress: MerchantOnboardingDocument): Promise<void> {
    const attempts = progress.otpFailedAttempts + 1;

    if (attempts < OTP_MAX_FAILED_ATTEMPTS) {
      await this.onboarding.updateOne({ _id: progress._id }, { $set: { otpFailedAttempts: attempts } });
      return;
    }

    await this.token.deleteMany({ userId: user._id, type: TokenType.PHONE_VERIFICATION });
    await this.onboarding.updateOne(
      { _id: progress._id },
      { $set: { otpFailedAttempts: 0, otpLockedUntil: new Date(Date.now() + OTP_LOCK_MINUTES * 60 * 1000) } },
    );
  }
}
