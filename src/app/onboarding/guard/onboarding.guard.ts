import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UserRepository } from '@on/app/user/repository/user.repository';

import { ONBOARDING_TOKEN_SCOPE, onboardingTokenSecret } from '../helpers';

/** Accepts only onboarding tokens issued after phone verification. Login tokens are rejected. */
@Injectable()
export class OnboardingGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly user: UserRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const [scheme, token] = String(request.headers.authorization ?? '').split(' ');

    if (scheme !== 'Bearer' || !token) throw new UnauthorizedException('Onboarding token is required.');

    let payload: { _id?: string; scope?: string };
    try {
      payload = await this.jwt.verifyAsync(token, { secret: onboardingTokenSecret() });
    } catch {
      throw new UnauthorizedException('Onboarding session has expired. Please verify your phone number again.');
    }

    if (payload.scope !== ONBOARDING_TOKEN_SCOPE || !payload._id) {
      throw new UnauthorizedException('Invalid onboarding token.');
    }

    const user = await this.user.findById(payload._id);
    if (!user) throw new UnauthorizedException('User no longer exists.');

    request.user = user;

    return true;
  }
}
