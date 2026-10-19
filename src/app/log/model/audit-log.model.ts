import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Types } from 'mongoose';

import { AuditAction, AuditModule, AuditStatus, IAuditLog } from '../type/audit-log.interface';

export type AuditLogDocument = HydratedDocument<AuditLog>;

@Schema({ collection: 'audit_logs', timestamps: true, versionKey: false })
export class AuditLog implements IAuditLog {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: ObjectId;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recordId?: ObjectId;

  @ApiProperty()
  @Prop({ required: false })
  userName: string;

  @ApiProperty()
  @Prop({ type: String, enum: AuditAction, index: true })
  action: AuditAction;

  @ApiProperty()
  @Prop({ type: String, enum: AuditModule })
  module: AuditModule;

  @ApiProperty()
  @Prop({ type: String })
  recordType?: string;

  @ApiProperty()
  @Prop({ type: String })
  recordReference?: string;

  @ApiProperty()
  @Prop({ type: String })
  description: string;

  @ApiProperty()
  @Prop({ type: String, enum: AuditStatus })
  status: AuditStatus;

  @ApiProperty()
  @Prop({ type: String })
  ip?: string;

  @ApiProperty()
  @Prop({ type: String })
  userAgent?: string;

  @ApiProperty()
  @Prop({ type: Object })
  meta?: Record<string, any>;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);
