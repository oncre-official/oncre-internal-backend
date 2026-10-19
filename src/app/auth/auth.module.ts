import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { config } from '@on/config';
import { BrevoService } from '@on/services/brevo/service';
import { DatabaseService } from '@on/services/db';

import { LogModule } from '../log/log.module';
import { RoleModule } from '../role/role.module';
import { UserModule } from '../user/user.module';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategy/jwt.strategy';

@Module({
  imports: [
    UserModule,
    RoleModule,
    LogModule,
    JwtModule.register({
      global: true,
      secret: config.jwt.secret,
      signOptions: { expiresIn: Number(config.jwt.expiresIn) },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, DatabaseService, BrevoService],
  exports: [AuthService],
})
export class AuthModule {}
