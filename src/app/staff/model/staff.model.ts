import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { Document, HydratedDocument, Types } from 'mongoose';

import { StaffStatus } from '../types/index.interface';
import { IStaff } from '../types/staff.interface';

export type StaffDocument = HydratedDocument<Staff>;

@Schema({ versionKey: false, timestamps: true })
export class Staff extends Document implements IStaff {
  @ApiProperty({ description: 'User ID associated with the staff', type: String, required: false })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  userId?: ObjectId;

  @ApiProperty({ description: 'The staff supervisor', required: false })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  supervisorId: ObjectId;

  @ApiProperty({ description: 'User who created the staff', required: false })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  createdBy: ObjectId;

  @ApiProperty({ description: 'Unique identifier for the staff', example: 'AG-00001' })
  @Prop({ required: false, unique: true })
  code: string;

  @ApiProperty({ description: 'First name of the staff' })
  @Prop({ required: false })
  firstName: string;

  @ApiProperty({ description: 'Last name of the staff' })
  @Prop({ required: false })
  lastName: string;

  @ApiProperty({ description: 'Email of the staff' })
  @Prop({ required: false })
  email: string;

  @ApiProperty({ description: 'Phone number of the staff' })
  @Prop({ required: false })
  phone: string;

  @ApiProperty({ description: 'Personal address of the staff', example: '32, Ozumba nbadiwer, VI' })
  @Prop({ required: false })
  address: string;

  @ApiProperty()
  @Prop({ enum: StaffStatus, required: true, default: StaffStatus.ACTIVE })
  status: StaffStatus;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);

StaffSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

StaffSchema.virtual('supervisor', {
  ref: 'User',
  localField: 'supervisorId',
  foreignField: '_id',
  justOne: true,
});

StaffSchema.virtual('creator', {
  ref: 'User',
  localField: 'createdBy',
  foreignField: '_id',
  justOne: true,
});

StaffSchema.set('toObject', { virtuals: true });
StaffSchema.set('toJSON', { virtuals: true });
