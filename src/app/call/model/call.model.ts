import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { Document, HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

import { Case } from '@on/app/case/model/case.model';

import { ICall } from '../types/call.interface';
import { CallOutcome, CallScheduleStatus } from '../types/index.interface';

export type CallDocument = HydratedDocument<Call>;

@Schema({ collection: 'calls', versionKey: false, timestamps: true })
export class Call extends Document implements ICall {
  @ApiProperty({ description: 'Case ID this call belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Case', required: true, index: true })
  caseId: ObjectId;

  @ApiProperty({ description: 'Merchant / recovery client ID' })
  @Prop({ type: Types.ObjectId, ref: 'Merchant', required: true, index: true })
  merchantId: ObjectId;

  @ApiProperty({ description: 'Customer ID' })
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId: ObjectId;

  @ApiProperty({ description: 'Recovery day number (e.g. 1, 3, 7, 14...)' })
  @Prop({ type: Number, required: true, min: 0, index: true })
  day: number;

  @ApiProperty({ description: 'When this schedule was created / set' })
  @Prop({ type: Date, required: true, default: () => new Date() })
  scheduledAt: Date;

  @ApiProperty({ description: 'When the call is due to be executed' })
  @Prop({ type: Date, required: true, index: true })
  scheduledFor: Date;

  @ApiProperty({ enum: CallScheduleStatus, description: 'Current status of the call schedule' })
  @Prop({
    type: String,
    enum: CallScheduleStatus,
    required: true,
    default: CallScheduleStatus.PENDING,
    index: true,
  })
  status: CallScheduleStatus;

  @ApiProperty({ description: 'Number of call attempts made' })
  @Prop({ type: Number, required: true, default: 0, min: 0 })
  attempts: number;

  @ApiPropertyOptional({ description: 'When the call was completed' })
  @Prop({ type: Date })
  completedAt?: Date;

  @ApiPropertyOptional({ enum: CallOutcome, description: 'Outcome of the call (if completed)' })
  @Prop({ type: String, enum: CallOutcome })
  outcome?: CallOutcome;

  @ApiPropertyOptional({ description: 'Agent notes' })
  @Prop({ type: String, trim: true })
  notes?: string;

  @ApiPropertyOptional({ description: 'Free-form metadata (telephony, disposition, etc.)' })
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  meta?: Record<string, any>;

  /**
   * ATTRIBUTES
   */
  @ApiHideProperty()
  case: Case;
}

export const CallSchema = SchemaFactory.createForClass(Call);

CallSchema.index({ status: 1, scheduledAt: 1 });
CallSchema.index({ caseId: 1, day: 1 }, { unique: true });
CallSchema.index({ merchantId: 1, status: 1 });
CallSchema.index({ customerId: 1, status: 1 });

CallSchema.virtual('case', {
  ref: 'Case',
  localField: 'caseId',
  foreignField: '_id',
  justOne: true,
});

CallSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

CallSchema.set('toObject', { virtuals: true });
CallSchema.set('toJSON', { virtuals: true });
