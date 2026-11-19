import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { Document, HydratedDocument, Types } from 'mongoose';

import { IMerchantOnboarding, OnboardingStep } from '../types/onboarding.interface';

export type MerchantOnboardingDocument = HydratedDocument<MerchantOnboarding>;

@Schema({ collection: 'merchant_onboarding', versionKey: false, timestamps: true })
export class MerchantOnboarding extends Document implements IMerchantOnboarding {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: ObjectId;

  @ApiProperty()
  @Prop({ type: String, required: true })
  countryCode: string;

  @ApiProperty()
  @Prop({ type: String, required: true })
  phone: string;

  @ApiProperty({ enum: OnboardingStep })
  @Prop({ type: String, enum: OnboardingStep, required: true, default: OnboardingStep.PHONE_PENDING })
  step: OnboardingStep;

  @Prop({ type: Number, default: 0 })
  otpSendCount: number;

  @Prop({ type: Date })
  otpWindowStartedAt?: Date;

  @Prop({ type: Date })
  lastOtpSentAt?: Date;

  @Prop({ type: Number, default: 0 })
  otpFailedAttempts: number;

  @Prop({ type: Date })
  otpLockedUntil?: Date;

  @Prop({ type: Number, default: 0 })
  ninFailedAttempts: number;

  @Prop({ type: Date })
  ninLockedUntil?: Date;

  @Prop({ type: Number, default: 0 })
  kybFailedAttempts: number;

  @Prop({ type: Date })
  kybLockedUntil?: Date;

  @ApiPropertyOptional()
  @Prop({ type: Types.ObjectId, ref: 'Merchant' })
  merchantId?: ObjectId;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  completedAt?: Date;
}

export const MerchantOnboardingSchema = SchemaFactory.createForClass(MerchantOnboarding);

MerchantOnboardingSchema.index({ countryCode: 1, phone: 1 });
