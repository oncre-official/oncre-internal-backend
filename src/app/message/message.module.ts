import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { LogModule } from '../log/log.module';
import { RoleModule } from '../role/role.module';
import { SharedModule } from '../shared/shared.module';
import { UserModule } from '../user/user.module';

import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { Message, MessageSchema } from './model/message.model';
import { MessageRepository } from './repository/message.repository';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }]),
    UserModule,
    LogModule,
    RoleModule,
    SharedModule,
  ],
  controllers: [MessageController],
  providers: [MessageRepository, MessageService, MessageRepository],
  exports: [MessageRepository, MessageService, MessageRepository],
})
export class MessageModule {}
