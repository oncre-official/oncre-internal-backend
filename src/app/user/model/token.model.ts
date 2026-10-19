import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { Document, HydratedDocument, Types } from 'mongoose';

import { TokenType } from '@on/enum';

import { IToken } from '../types/token.interface';

export type TokenDocument = HydratedDocument<Token>;

@Schema({ collection: 'tokens', versionKey: false, timestamps: true })
export class Token extends Document implements IToken {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId: ObjectId;

  @ApiProperty()
  @Prop({ enum: TokenType, required: true })
  type: TokenType;

  @ApiProperty()
  @Prop({ type: String, required: true })
  token: string;

  @ApiProperty()
  @Prop({ type: Date, default: () => new Date(Date.now() + 10 * 60 * 1000) })
  expiresAt: Date;
}

export const TokenSchema = SchemaFactory.createForClass(Token);
