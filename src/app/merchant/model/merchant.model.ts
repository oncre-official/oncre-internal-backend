import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { Document, HydratedDocument, Types } from 'mongoose';

import { MerchantChannel, MerchantStatus, MerchantType, Product } from '../types/index.interface';
import { IMerchant } from '../types/merchant.interface';

import { InstitutionDetails, InstitutionDetailsSchema } from './index.model';

export type MerchantDocument = HydratedDocument<Merchant>;

@Schema({ collection: 'merchants', versionKey: false, timestamps: true })
export class Merchant extends Document implements IMerchant {
  @ApiPropertyOptional({ description: 'User ID associated with the merchant' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: ObjectId;

  @ApiProperty({ description: 'User who created the merchant' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: ObjectId;

  @ApiProperty({ description: 'Unique identifier for the merchant', example: 'MER-00001' })
  @Prop({ required: true, unique: true })
  merchantId: string;

  @ApiProperty({ description: 'Personal name of the merchant', example: 'John Doe' })
  @Prop({ required: true })
  name: string;

  @ApiPropertyOptional({ description: 'Store name of the merchant', example: "John's Store" })
  @Prop()
  storeName?: string;

  @ApiProperty({ description: 'Phone number of the merchant', example: '+2348012345678' })
  @Prop({ required: true })
  phone: string;

  @ApiPropertyOptional({ description: 'Email address of the merchant', example: 'john@example.com' })
  @Prop()
  email?: string;

  @ApiPropertyOptional({ description: 'Location of the merchant', example: 'Lagos, Nigeria' })
  @Prop()
  location?: string;

  @ApiProperty({ description: 'Type of product', enum: Product, example: Product.DIRECT_INVOICE })
  @Prop({ type: String, enum: Product, required: true, default: Product.DIRECT_INVOICE })
  product: Product;

  @ApiProperty({ description: 'Type of merchant', enum: MerchantType, example: MerchantType.STANDARD })
  @Prop({ type: String, enum: MerchantType, required: true, default: MerchantType.STANDARD })
  type: MerchantType;

  @ApiProperty({ description: 'Channel through which the merchant was acquired', enum: MerchantChannel })
  @Prop({ type: String, enum: MerchantChannel, required: true })
  channel: MerchantChannel;

  @ApiProperty({
    description: 'Administrative approval status of the merchant',
    enum: MerchantStatus,
    example: MerchantStatus.PENDING,
  })
  @Prop({ type: String, enum: MerchantStatus, required: true, default: MerchantStatus.PENDING })
  status: MerchantStatus;

  @ApiPropertyOptional({ description: 'Date and time the merchant was activated', type: Date })
  @Prop({ type: Date })
  activatedAt?: Date;

  @ApiPropertyOptional({ description: 'Additional institution-specific information', type: () => InstitutionDetails })
  @Prop({ type: InstitutionDetailsSchema, required: false })
  institutionDetails?: InstitutionDetails;
}

export const MerchantSchema = SchemaFactory.createForClass(Merchant);

MerchantSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

MerchantSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

MerchantSchema.set('toObject', { virtuals: true });
MerchantSchema.set('toJSON', { virtuals: true });
