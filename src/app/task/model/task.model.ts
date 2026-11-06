import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiHideProperty, ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { Document, HydratedDocument, Schema as MongooseSchema, Types } from 'mongoose';

import { Case } from '@on/app/case/model/case.model';
import { Customer } from '@on/app/customer/model/customer.model';
import { Staff } from '@on/app/staff/model/staff.model';

import { StaffTaskStatus } from '../types/index.interface';
import { ITask } from '../types/task.interface';

export type TaskDocument = HydratedDocument<Task>;

@Schema({ collection: 'tasks', versionKey: false, timestamps: true })
export class Task extends Document implements ITask {
  @ApiProperty({ description: 'Case ID this task belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Case', required: true, index: true })
  caseId: ObjectId;

  @ApiProperty({ description: 'Merchant / recovery client ID' })
  @Prop({ type: Types.ObjectId, ref: 'Merchant', required: true, index: true })
  merchantId: ObjectId;

  @ApiProperty({ description: 'Customer ID' })
  @Prop({ type: Types.ObjectId, ref: 'Customer', required: true, index: true })
  customerId: ObjectId;

  @ApiProperty({ description: 'Agent assigned to the task ID' })
  @Prop({ type: Types.ObjectId, ref: 'Staff', required: true, index: true })
  agentId: ObjectId;

  @ApiProperty({ description: 'The agent supervisor ID' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: false })
  supervisorId: ObjectId;

  @ApiProperty({ description: 'The task title' })
  @Prop({ type: String, required: true })
  title: string;

  @ApiProperty({ description: 'The task description' })
  @Prop({ type: String, required: false })
  description: string;

  @ApiProperty({ description: 'Recovery day number (e.g. 1, 3, 7, 14...)' })
  @Prop({ type: Number, required: true, min: 0, index: true })
  day: number;

  @ApiProperty({ description: 'When this schedule was created / set' })
  @Prop({ type: Date, required: true, default: () => new Date() })
  scheduledAt: Date;

  @ApiProperty({ description: 'When the task is due to be executed' })
  @Prop({ type: Date, required: true, index: true })
  scheduledFor: Date;

  @ApiProperty({ enum: StaffTaskStatus, description: 'Current status of the task schedule' })
  @Prop({ type: String, enum: StaffTaskStatus, default: StaffTaskStatus.PENDING, index: true })
  status: StaffTaskStatus;

  @ApiProperty({ description: 'Number of task attempts made' })
  @Prop({ type: Number, required: true, default: 0, min: 0 })
  attempts: number;

  @ApiPropertyOptional({ description: 'When the task was completed' })
  @Prop({ type: Date })
  completedAt?: Date;

  @ApiPropertyOptional({ description: 'Free-form metadata (telephony, disposition, etc.)' })
  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  meta?: Record<string, any>;

  /**
   * ATTRIBUTES
   */
  @ApiHideProperty()
  case: Case;

  @ApiHideProperty()
  customer: Customer;

  @ApiHideProperty()
  agent: Staff;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ status: 1, scheduledAt: 1 });
TaskSchema.index({ caseId: 1, day: 1 }, { unique: true });
TaskSchema.index({ merchantId: 1, status: 1 });
TaskSchema.index({ customerId: 1, status: 1 });

TaskSchema.virtual('case', {
  ref: 'Case',
  localField: 'caseId',
  foreignField: '_id',
  justOne: true,
});

TaskSchema.virtual('customer', {
  ref: 'Customer',
  localField: 'customerId',
  foreignField: '_id',
  justOne: true,
});

TaskSchema.virtual('agent', {
  ref: 'Staff',
  localField: 'agentId',
  foreignField: '_id',
  justOne: true,
});

TaskSchema.set('toObject', { virtuals: true });
TaskSchema.set('toJSON', { virtuals: true });
