import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument, Types } from 'mongoose';

import { IRolePermission } from '../types/role.interface';

import { Permission } from './permission.model';

export type RolePermissionDocument = HydratedDocument<RolePermission>;

@Schema({ collection: 'role_permissions', versionKey: false, timestamps: true })
export class RolePermission extends Document implements IRolePermission {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Role' })
  roleId: string;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Permission' })
  permissionId: string;

  /**
   * UTILITY
   */
  @ApiHideProperty()
  permission: Permission;
}

export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);

RolePermissionSchema.virtual('permission', {
  ref: 'Permission',
  localField: 'permissionId',
  foreignField: '_id',
  justOne: true,
});

RolePermissionSchema.set('toJSON', { virtuals: true });
RolePermissionSchema.set('toObject', { virtuals: true });
