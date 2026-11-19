import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { User } from '@on/app/user/model/user.model';

import { ONBOARDING_TOKEN_SCOPE, ONBOARDING_TOKEN_TTL_SECONDS, onboardingTokenSecret } from './helpers';

/**
 * Merchant tokens.
 */
@Injectable()
export class MerchantSessionService {
  constructor(private readonly jwt: JwtService) {}

  /**
   * Login token.
   */
  async issueLoginToken(user: User): Promise<string> {
    return await this.jwt.signAsync({ _id: String(user._id) });
  }

  /**
   * Onboarding token, used for the NIN step. Not valid for JwtAuthGuard.
   */
  async issueOnboardingToken(user: User): Promise<string> {
    return await this.jwt.signAsync(
      { _id: String(user._id), scope: ONBOARDING_TOKEN_SCOPE },
      { secret: onboardingTokenSecret(), expiresIn: ONBOARDING_TOKEN_TTL_SECONDS },
    );
  }
}
