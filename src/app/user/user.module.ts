import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TermiiService } from '@on/services/termii/service';

import { RoleModule } from '../role/role.module';

import { Token, TokenSchema } from './model/token.model';
import { User, UserSchema } from './model/user.model';
import { TokenRepository } from './repository/token.repository';
import { UserRepository } from './repository/user.repository';
import { UserSeeder } from './seeder/seeder';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Token.name, schema: TokenSchema },
    ]),
    RoleModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserSeeder, UserRepository, TokenRepository, TermiiService],
  exports: [UserService, UserRepository, TokenRepository],
})
export class UserModule {}
