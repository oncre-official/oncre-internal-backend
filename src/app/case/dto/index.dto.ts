import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

import { ICaseAssetDetails, ICaseFlags } from '../types/index.interface';

export class CaseTagDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  campaign?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  product?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  debtAage?: string;
}

export class CaseFlagsDto implements ICaseFlags {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  disputed?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  deceased?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  inLegalProcess?: boolean;
}

export class CaseAssetDetailsDto implements ICaseAssetDetails {
  @ApiPropertyOptional({ example: 'Samsung Galaxy A15' })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiPropertyOptional({ example: 'IMEI-123456789' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({ example: 'LOCKED' })
  @IsOptional()
  @IsString()
  lockStatus?: string;

  [key: string]: unknown;
}
