import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { Document, HydratedDocument, Types } from 'mongoose';

import {
  IKycVerifiedBusiness,
  IKycVerifiedName,
  IMerchantKyc,
  KycProvider,
  KycStatus,
  KycType,
} from '../types/kyc.interface';

export type MerchantKycDocument = HydratedDocument<MerchantKyc>;

@Schema({ _id: false })
export class KycVerifiedName implements IKycVerifiedName {
  @ApiProperty()
  @Prop({ type: String, required: true })
  firstName: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  middleName?: string;

  @ApiProperty()
  @Prop({ type: String, required: true })
  lastName: string;

  @ApiProperty()
  @Prop({ type: String, required: true })
  fullName: string;
}

export const KycVerifiedNameSchema = SchemaFactory.createForClass(KycVerifiedName);

@Schema({ _id: false })
export class KycVerifiedBusiness implements IKycVerifiedBusiness {
  @ApiProperty({ example: 'ACME FINANCIAL SERVICES LIMITED' })
  @Prop({ type: String, required: true })
  legalName: string;

  @ApiProperty({ example: 'RC123456' })
  @Prop({ type: String, required: true })
  registrationNumber: string;
}

export const KycVerifiedBusinessSchema = SchemaFactory.createForClass(KycVerifiedBusiness);

@Schema({ collection: 'merchant_kyc', versionKey: false, timestamps: true })
export class MerchantKyc extends Document implements IMerchantKyc {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: ObjectId;

  @ApiPropertyOptional()
  @Prop({ type: Types.ObjectId, ref: 'Merchant' })
  merchantId?: ObjectId;

  @ApiProperty({ enum: KycType })
  @Prop({ type: String, enum: KycType, required: true })
  type: KycType;

  @ApiProperty({ enum: KycProvider })
  @Prop({ type: String, enum: KycProvider, required: true })
  provider: KycProvider;

  @ApiProperty({ example: '*******4821' })
  @Prop({ type: String, required: true })
  idNumberMasked: string;

  /** Keyed hash of the ID number, used only to stop one NIN opening two merchants. Never exposed. */
  @Prop({ type: String, required: true, select: false })
  idNumberHash: string;

  @ApiPropertyOptional({ type: () => KycVerifiedName })
  @Prop({ type: KycVerifiedNameSchema })
  verifiedName?: KycVerifiedName;

  @ApiPropertyOptional({ type: () => KycVerifiedBusiness })
  @Prop({ type: KycVerifiedBusinessSchema })
  verifiedBusiness?: KycVerifiedBusiness;

  @ApiProperty({ enum: KycStatus })
  @Prop({ type: String, enum: KycStatus, required: true, default: KycStatus.PENDING })
  status: KycStatus;

  @ApiPropertyOptional()
  @Prop({ type: String })
  providerReference?: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  failureReason?: string;

  @ApiPropertyOptional()
  @Prop({ type: Date })
  verifiedAt?: Date;
}

export const MerchantKycSchema = SchemaFactory.createForClass(MerchantKyc);

MerchantKycSchema.index({ userId: 1, type: 1 });
MerchantKycSchema.index(
  { type: 1, idNumberHash: 1 },
  { unique: true, partialFilterExpression: { status: KycStatus.VERIFIED } },
);
