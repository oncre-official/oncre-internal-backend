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
  @Prop({ required: true, index: true })
  action: string;

  @ApiProperty()
  @Prop({ required: true })
  route: string;

  @ApiProperty()
  @Prop({ type: String, enum: HttpMethod })
  method: HttpMethod;

  @ApiProperty()
  @Prop({ type: String, enum: LogLevel })
  log: LogLevel;

  @ApiProperty()
  @Prop({ type: String })
  reason: string;

  @ApiProperty()
  @Prop({ type: String })
  ip: string;

  @ApiProperty()
  @Prop({ type: String })
  userAgent?: string;

  @ApiProperty()
  @Prop({ type: Object })
  error?: Record<string, any>;

  @ApiProperty()
  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export const LogSchema = SchemaFactory.createForClass(Log);
