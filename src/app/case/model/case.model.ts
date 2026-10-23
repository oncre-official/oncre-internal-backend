import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

import { Customer } from '@on/app/customer/model/customer.model';
import { Merchant } from '@on/app/merchant/model/merchant.model';
import { Product } from '@on/app/merchant/types/index.interface';
import { Staff } from '@on/app/staff/model/staff.model';

import { ICase } from '../types/case.interface';
import { CaseSource, CaseStatus, NigerianZone, RecoveryClassification, RecoveryMode } from '../types/index.interface';

import {
  CaseAssetDetails,
  CaseAssetDetailsSchema,
  CaseFlags,
  CaseFlagsSchema,
  CaseTags,
  CaseTagsSchema,
} from './index.model';

export type CaseDocument = HydratedDocument<Case>;

@Schema({ collection: 'cases', versionKey: false, timestamps: true })
export class Case implements ICase {
  @ApiProperty({ description: 'Case ID, unique within the client' })
  @Prop({ type: String, required: true })
  caseId: string;

  @ApiProperty({ description: 'Merchant ID or recovery client ID' })
  @Prop({ type: String, required: true })
  merchantId: ObjectId;

  @ApiProperty({ description: 'Customer ID', required: false })
  @Prop({ type: String, required: true })
  customerId: ObjectId;

  @ApiProperty({ enum: RecoveryClassification })
  @Prop({ type: String, enum: RecoveryClassification, required: true })
  classification: RecoveryClassification;

  @ApiProperty({ enum: NigerianZone })
  @Prop({ type: String, enum: NigerianZone })
  zone: NigerianZone;

  @ApiProperty({ type: Number, minimum: 0 })
  @Prop({ type: Number, required: true, min: 0 })
  outstandingBalance: number;

  @ApiProperty({ type: Number, minimum: 0, default: 0 })
  @Prop({ type: Number, required: true, default: 0, min: 0 })
  amountPaid: number;

  @ApiProperty({ type: Number, minimum: 0 })
  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @ApiProperty({ type: Date })
  @Prop({ type: Date, required: true })
  dueDate: Date;

  @ApiProperty({ type: Number, minimum: 0 })
  @Prop({ type: Number, required: true, min: 0, default: 0 })
  debtAge: number;

  @ApiPropertyOptional({ type: Date })
  @Prop({ type: Date })
  lastPaymentDate?: Date;

  @ApiPropertyOptional({ type: Date })
  @Prop({ type: Date })
  loanStartDate?: Date;

  @ApiPropertyOptional({ description: 'Merchant product category' })
  @Prop({ type: MongooseSchema.Types.Mixed })
  product: Product;

  @ApiPropertyOptional()
  @Prop({ type: String })
  description: string;

  @ApiProperty({ enum: CaseStatus })
  @Prop({ type: String, enum: CaseStatus, required: true, default: CaseStatus.NEW_IMPORTED })
  status: CaseStatus;

  @ApiProperty({ type: String })
  @Prop({ type: String, required: false })
  nextAction: string;

  @ApiPropertyOptional({ type: Date })
  @Prop({ type: Date })
  nextActionAt: Date;

  @ApiPropertyOptional({ type: String })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Staff' })
  agentId: ObjectId;

  @ApiPropertyOptional({ type: String })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  supervisorId: ObjectId;

  @ApiProperty({ enum: CaseSource })
  @Prop({ type: String, enum: CaseSource, required: true, default: CaseSource.MANUAL })
  source: CaseSource;

  @ApiPropertyOptional()
  @Prop({ type: String })
  batchId: string;

  @ApiPropertyOptional()
  @Prop({ type: CaseTagsSchema })
  tag: CaseTags;

  @ApiPropertyOptional()
  @Prop({ type: CaseFlagsSchema })
  flags?: CaseFlags;

  @ApiPropertyOptional()
  @Prop({ type: CaseAssetDetailsSchema })
  assetDetails?: CaseAssetDetails;

  @ApiPropertyOptional()
  @Prop({ type: String })
  priorRecoveryAttempts?: string;

  @ApiPropertyOptional({ type: [String] })
  @Prop({ type: [String], default: [] })
  supportingDocuments?: string[];

  @ApiPropertyOptional({ enum: RecoveryMode })
  @Prop({ type: String, enum: RecoveryMode })
  recoveryMode?: RecoveryMode;

  @ApiPropertyOptional()
  @Prop({ type: String })
  paymentPlanId?: string;

  @ApiProperty({ type: Boolean, default: false })
  @Prop({ type: Boolean, default: false })
  paused: boolean;

  @ApiPropertyOptional({ type: Boolean })
  @Prop({ type: Boolean, default: false })
  hold?: boolean;

  @ApiPropertyOptional({ type: Date })
  @Prop({ type: Date })
  holdUntil?: Date;

  @ApiPropertyOptional()
  @Prop({ type: String })
  pauseReason?: string;

  @ApiPropertyOptional({ type: Date })
  @Prop({ type: Date })
  pausedAt?: Date;

  @ApiPropertyOptional({ type: Number })
  @Prop({ type: Number, min: 0 })
  pausedAtDay?: number;

  @ApiPropertyOptional({ type: Number })
  @Prop({ type: Number, min: 0 })
  pausedAtLevel?: number;

  @ApiPropertyOptional({ type: Date })
  @Prop({ type: Date })
  activatedAt?: Date;

  @ApiPropertyOptional({ type: Date })
  @Prop({ type: Date })
  recoveredAt?: Date;

  @ApiPropertyOptional({ type: Date })
  @Prop({ type: Date })
  closedAt?: Date;

  /**
   * ATTRIBUTES
   */

  @ApiHideProperty()
  merchant: Merchant;

  @ApiHideProperty()
  customer: Customer;

  @ApiHideProperty()
  agent: Staff;
}

export const CaseSchema = SchemaFactory.createForClass(Case);

CaseSchema.index({ merchantId: 1, caseId: 1 }, { unique: true });
CaseSchema.index({ status: 1, nextActionAt: 1 });
CaseSchema.index({ agentId: 1, status: 1 });
CaseSchema.index({ supervisorId: 1, status: 1 });
CaseSchema.index({ portfolioId: 1 });
CaseSchema.index({ batchId: 1 });

CaseSchema.virtual('merchant', {
  ref: 'Merchant',
  localField: 'merchantId',
  foreignField: '_id',
  justOne: true,
});

CaseSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

CaseSchema.virtual('agent', {
  ref: 'Staff',
  localField: 'agentId',
  foreignField: '_id',
  justOne: true,
});

CaseSchema.set('toObject', { virtuals: true });
CaseSchema.set('toJSON', { virtuals: true });
