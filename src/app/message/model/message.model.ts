import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Document, HydratedDocument, Types, Schema as MongooseSchema } from 'mongoose';

import { MessageScheduleStatus, MessageType } from '../types/index.interface';
import { IMessage } from '../types/message.interface';

export type MessageDocument = HydratedDocument<Message>;

@Schema({ collection: 'messages', versionKey: false, timestamps: true })
export class Message extends Document implements IMessage {
  @ApiProperty({ description: 'Case ID this message belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Case', required: true, index: true })
  caseId: Types.ObjectId;

  @ApiProperty({ description: 'Merchant / recovery client ID' })
  @Prop({ type: Types.ObjectId, ref: 'Merchant', required: true, index: true })
  merchantId: Types.ObjectId;

  @ApiProperty({ description: 'Customer ID' })
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId: Types.ObjectId;

  @ApiProperty({ description: 'Recovery day number (e.g. 1, 2, 7, 14...)' })
  @Prop({ type: Number, required: true, min: 0, index: true })
  day: number;

  @ApiProperty({ description: 'When the message schedule was created' })
  @Prop({ type: Date, required: true, default: () => new Date() })
  scheduledAt: Date;

  @ApiProperty({ description: 'When the message is due to be sent' })
  @Prop({ type: Date, required: true, index: true })
  scheduledFor: Date;

  @ApiProperty({ enum: MessageType })
  @Prop({ type: String, enum: MessageType, required: true })
  type: MessageType;

  @ApiProperty({ enum: MessageScheduleStatus })
  @Prop({
    type: String,
    enum: MessageScheduleStatus,
    required: true,
    default: MessageScheduleStatus.PENDING,
    index: true,
  })
  status: MessageScheduleStatus;

  @ApiPropertyOptional({ description: 'ID returned by the SMS/email provider' })
  @Prop({ type: String })
  serviceMessageId: string;

  @ApiPropertyOptional({ description: 'Whether a payment link was generated for this message' })
  @Prop({ type: Boolean, default: false })
  paymentLinkGenerated: boolean;

  @ApiProperty({ description: 'Number of send attempts made' })
  @Prop({ type: Number, required: true, default: 0, min: 0 })
  attempts: number;

  @ApiPropertyOptional({ description: 'When the worker locked this message' })
  @Prop({ type: Date })
  lockedAt?: Date;

  @ApiPropertyOptional({ description: 'Lock expiry — stale lock recovery' })
  @Prop({ type: Date })
  lockUntil?: Date;

  @ApiPropertyOptional({ description: 'When to retry after a failure' })
  @Prop({ type: Date })
  nextRetryAt?: Date;

  @ApiPropertyOptional({ description: 'Last error message from a failed send' })
  @Prop({ type: String })
  lastError?: string;

  @ApiPropertyOptional({ description: 'When the message was sent successfully' })
  @Prop({ type: Date })
  sentAt?: Date;

  @ApiPropertyOptional({ description: 'Free-form metadata (provider, template, etc.)' })
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  meta?: Record<string, any>;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ caseId: 1, day: 1 }, { unique: true });
MessageSchema.index({ merchantId: 1, status: 1 });
MessageSchema.index({ customerId: 1, status: 1 });
MessageSchema.index({ status: 1, scheduledAt: 1 });

MessageSchema.virtual('case', {
  ref: 'Case',
  localField: 'caseId',
  foreignField: '_id',
  justOne: true,
});

MessageSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

MessageSchema.set('toObject', { virtuals: true });
MessageSchema.set('toJSON', { virtuals: true });
