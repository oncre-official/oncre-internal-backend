import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Types } from 'mongoose';

import { HttpMethod, ILog, LogLevel } from '../type/log.interface';

export type LogDocument = HydratedDocument<Log>;

@Schema({ collection: 'logs', timestamps: true, versionKey: false })
export class Log implements ILog {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true })
  customerId: ObjectId;

  @ApiProperty()
  @Prop({ required: true, index: true })
  name: string;

  @ApiProperty()
  @Prop({ type: String, enum: LogLevel, default: LogLevel.INFO, index: true })
  level: LogLevel;

  @ApiProperty()
  @Prop({ type: String, enum: HttpMethod })
  method?: HttpMethod;

  @ApiProperty()
  @Prop({ type: String })
  path?: string;

  @ApiProperty()
  @Prop({ type: Number })
  statusCode?: number;

  @ApiProperty()
  @Prop({ type: String })
  ip?: string;

  @ApiProperty()
  @Prop({ type: String })
  userAgent?: string;

  @ApiProperty()
  @Prop()
  duration?: number;

  @ApiProperty()
  @Prop({ type: Object })
  error?: Record<string, any>;

  @ApiProperty()
  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export const LogSchema = SchemaFactory.createForClass(Log);
