import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Types } from 'mongoose';

import { ExternalRequestStatus, IExternalLog } from '../type/log.interface';

export type ExternalLogDocument = HydratedDocument<ExternalLog>;

@Schema({ collection: 'external_logs', timestamps: true, versionKey: false })
export class ExternalLog implements IExternalLog {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId: ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: false })
  customerId: ObjectId;

  @ApiProperty()
  @Prop({ required: true, index: true })
  name: string;

  @ApiProperty()
  @Prop({ index: true })
  provider?: string;

  @ApiProperty()
  @Prop({ required: false })
  method: string;

  @ApiProperty()
  @Prop({ required: false })
  url: string;

  @ApiProperty()
  @Prop({ type: String, enum: ExternalRequestStatus })
  status: ExternalRequestStatus;

  @ApiProperty()
  @Prop({ index: true })
  statusCode?: number;

  @ApiProperty()
  @Prop()
  duration?: number;

  @ApiProperty()
  @Prop({ type: Object })
  request?: Record<string, any>;

  @ApiProperty()
  @Prop({ type: Object })
  response?: Record<string, any>;

  @ApiProperty()
  @Prop({ type: Object })
  error?: Record<string, any>;

  @ApiProperty()
  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export const ExternalLogSchema = SchemaFactory.createForClass(ExternalLog);
