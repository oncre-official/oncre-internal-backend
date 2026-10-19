import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { ICaseAssetDetails, ICaseFlags } from '../types/index.interface';

@Schema({ _id: false, versionKey: false })
export class CaseFlags implements ICaseFlags {
  @ApiPropertyOptional()
  @Prop({ type: Boolean, default: false })
  disputed?: boolean;

  @ApiPropertyOptional()
  @Prop({ type: Boolean, default: false })
  deceased?: boolean;

  @ApiPropertyOptional()
  @Prop({ type: Boolean, default: false })
  inLegalProcess?: boolean;
}

export const CaseFlagsSchema = SchemaFactory.createForClass(CaseFlags);

@Schema({ _id: false, versionKey: false })
export class CaseAssetDetails implements ICaseAssetDetails {
  @ApiPropertyOptional()
  @Prop({ type: String })
  deviceModel?: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  serialNumber?: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  lockStatus?: string;

  [key: string]: unknown;
}

export const CaseAssetDetailsSchema = SchemaFactory.createForClass(CaseAssetDetails);

@Schema({ _id: false, versionKey: false })
export class CaseTags {
  @ApiPropertyOptional()
  @Prop({ type: String })
  campaign?: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  product?: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  location?: string;

  @ApiPropertyOptional()
  @Prop({ type: String })
  debtAage?: string;
}

export const CaseTagsSchema = SchemaFactory.createForClass(CaseTags);
