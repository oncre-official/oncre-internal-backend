import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { BaseRepository } from '@on/repository/base.repository';

import { Message, MessageDocument } from '../model/message.model';

export class MessageRepository extends BaseRepository<MessageDocument> {
  constructor(@InjectModel(Message.name) private messageModel: Model<MessageDocument>) {
    super(messageModel);
  }
}
