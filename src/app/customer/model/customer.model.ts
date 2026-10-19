import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { Document, HydratedDocument, Types } from 'mongoose';

import { CustomerStatus, ICustomer } from '../types/customer.interface';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({ collection: 'customers', versionKey: false, timestamps: true })
export class Customer extends Document implements ICustomer {
  @ApiProperty({ description: 'User ID associated with the customer', type: String, required: false })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: ObjectId;

  @ApiProperty({ description: 'User who created the customer', required: false })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy?: ObjectId;

  @ApiProperty({ description: 'Unique identifier for the customer', example: 'CUS-00001' })
  @Prop({ required: false, unique: true })
  customerId: string;

  @ApiProperty({ description: 'Unique identifier for the customer', example: 'MER-00001' })
  @Prop({ required: true })
  key: string;

  @ApiProperty({ description: 'Phone number of the customer', example: '+1234567890' })
  @Prop({ required: true })
  phone: string;

  @ApiProperty({ description: 'Personal name of the customer', example: 'John Doe' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Personal address of the customer', example: '32, Ozumba nbadiwer, VI' })
  @Prop({ required: false })
  address: string;

  @ApiProperty()
  @Prop({ enum: CustomerStatus, required: true, default: CustomerStatus.ACTIVE })
  status: CustomerStatus;

  @ApiProperty({ description: 'Business name of the customer', example: 'Ola Ventures' })
  @Prop({ required: false })
  businessName: string;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

CustomerSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

CustomerSchema.set('toObject', { virtuals: true });
CustomerSchema.set('toJSON', { virtuals: true });
