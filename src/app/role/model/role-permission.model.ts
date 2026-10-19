import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument, Types } from 'mongoose';

import { IRolePermission } from '../types/role.interface';

export type RolePermissionDocument = HydratedDocument<RolePermission>;

@Schema({ collection: 'role_permissions', versionKey: false, timestamps: true })
export class RolePermission extends Document implements IRolePermission {
  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Role' })
  roleId: string;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'Permission' })
  permissionId: string;
}

export const RolePermissionSchema = SchemaFactory.createForClass(RolePermission);

// RolePermissionSchema.index({ roleId: 1, permissionId: 1 });
