import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '@on/app/user/model/user.model';

import { ONBOARDING_TOKEN_SCOPE, ONBOARDING_TOKEN_TTL_SECONDS, onboardingTokenSecret } from './helpers';

/**
 * Issues every token a merchant gets. Changing what a token holds, how long it lasts, or adding
 * refresh tokens happens here only.
 */
@Injectable()
export class MerchantSessionService {
  constructor(private readonly jwt: JwtService) {}

  /** Normal login token, accepted by JwtAuthGuard. Holds only the user id. */
  async issueLoginToken(user: User): Promise<string> {
    return await this.jwt.signAsync({ _id: String(user._id) });
  }

  /** Short-lived token for the sign-up steps after the phone is verified. Rejected by JwtAuthGuard. */
  async issueOnboardingToken(user: User): Promise<string> {
    return await this.jwt.signAsync(
      { _id: String(user._id), scope: ONBOARDING_TOKEN_SCOPE },
      { secret: onboardingTokenSecret(), expiresIn: ONBOARDING_TOKEN_TTL_SECONDS },
    );
  }
}
