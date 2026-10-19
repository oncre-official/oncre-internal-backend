import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument } from 'mongoose';

import { IRole } from '../types/role.interface';

import { Permission } from './permission.model';

export type RoleDocument = HydratedDocument<Role>;

@Schema({ collection: 'roles', versionKey: false, timestamps: true })
export class Role extends Document implements IRole {
  @ApiProperty()
  @Prop({ type: String, required: true })
  name: string;

  @ApiProperty()
  @Prop({ type: String })
  description?: string;

  /**
   * RELATIONSHIPS
   */
  @ApiHideProperty()
  permissions: Permission[];
}

export const RoleSchema = SchemaFactory.createForClass(Role);

RoleSchema.index({ name: 1 }, { unique: true });

RoleSchema.virtual('permissions', {
  ref: 'RolePermission',
  localField: '_id',
  foreignField: 'roleId',
  justOne: false,
});

RoleSchema.set('toJSON', { virtuals: true });
RoleSchema.set('toObject', { virtuals: true });
