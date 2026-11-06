import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiPropertyOptional } from '@nestjs/swagger';

import {
  ICaseAssetDetails,
  ICaseFlags,
  RecoveryClassification,
  RecoveryScheduleStatus,
} from '../types/index.interface';

@Schema({ _id: false, versionKey: false })
export class CaseFlags implements ICaseFlags {
  @ApiPropertyOptional()
  @Prop({ type: Boolean, default: false })
  disputed?: boolean;

  @ApiPropertyOptional()
  @Prop({ type: Boolean, default: false })
  deceased?: boolean;

  @ApiPropertyOptional()
  @Prop({ type: Boolean, default: false })
  inLegalProcess?: boolean;
}

export const CaseFlagsSchema = SchemaFactory.createForClass(CaseFlags);

@Schema({ _id: false, versionKey: false })
export class CaseAssetDetails implements ICaseAssetDetails {
  @ApiPropertyOptional()
  @Prop({ type: String })
  deviceModel?: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  serialNumber?: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  lockStatus?: string;

  [key: string]: unknown;
}

export const CaseAssetDetailsSchema = SchemaFactory.createForClass(CaseAssetDetails);

@Schema({ _id: false, versionKey: false })
export class CaseTags {
  @ApiPropertyOptional()
  @Prop({ type: String })
  campaign?: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  product?: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  location?: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  debtAage?: string;
}

export const CaseTagsSchema = SchemaFactory.createForClass(CaseTags);

@Schema({ _id: false, versionKey: false })
export class RecoveryScheduleChannel {
  @ApiPropertyOptional()
  @Prop({ type: Boolean, default: false })
  scheduled: boolean;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  scheduledAt?: Date;

  @ApiPropertyOptional()
  @Prop({ type: Number, default: 0 })
  total: number;
}

@Schema({ _id: false, versionKey: false })
export class RecoverySchedule {
  @ApiPropertyOptional()
  @Prop({ type: Number })
  duration: number;

  @ApiPropertyOptional()
  @Prop({ type: String, enum: RecoveryClassification })
  engine: RecoveryClassification;

  @ApiPropertyOptional({ enum: RecoveryScheduleStatus })
  @Prop({ type: String, enum: RecoveryScheduleStatus, default: RecoveryScheduleStatus.PENDING })
  status: RecoveryScheduleStatus;

  @ApiPropertyOptional({ type: () => RecoveryScheduleChannel })
  @Prop({ type: RecoveryScheduleChannel, default: () => ({}) })
  call: RecoveryScheduleChannel;

  @ApiPropertyOptional({ type: () => RecoveryScheduleChannel })
  @Prop({ type: RecoveryScheduleChannel, default: () => ({}) })
  messaging: RecoveryScheduleChannel;

  @ApiPropertyOptional({ type: () => RecoveryScheduleChannel })
  @Prop({ type: RecoveryScheduleChannel, default: () => ({}) })
  task: RecoveryScheduleChannel;

  @ApiPropertyOptional()
  @Prop({ type: Boolean, default: false })
  completed: boolean;

  @ApiPropertyOptional()
  @Prop({ type: Number, default: 0 })
  attempts: number;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  lastAttemptAt?: Date;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  scheduledAt?: Date;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  completedAt?: Date;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  lockedAt?: Date;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  lockUntil?: Date;

  @ApiPropertyOptional()
  @Prop({ type: String })
  lastError?: string;
}

export const RecoveryScheduleSchema = SchemaFactory.createForClass(RecoverySchedule);
