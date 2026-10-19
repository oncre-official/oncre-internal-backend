import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument } from 'mongoose';

import { IPermission } from '../types/permission.interface';

export type PermissionDocument = HydratedDocument<Permission>;

@Schema({ collection: 'permissions', versionKey: false, timestamps: true })
export class Permission extends Document implements IPermission {
  @ApiProperty()
  @Prop({ type: String, required: true })
  name: string;

  @ApiProperty()
  @Prop({ type: String })
  description?: string;
}

export const PermissionSchema = SchemaFactory.createForClass(Permission);

PermissionSchema.index({ name: 1 }, { unique: true });
