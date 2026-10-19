import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsDateString,
  Min,
  ValidateNested,
  IsObject,
  IsNotEmpty,
} from 'class-validator';

import { Product } from '@on/app/merchant/types/index.interface';

import { RecoveryClassification, RecoveryMode } from '../types/index.interface';

import { CaseFlagsDto, CaseTagDto } from './index.dto';

export class CreateCaseDto {
  @ApiProperty({ enum: RecoveryClassification, example: RecoveryClassification.MERCHANT })
  @IsEnum(RecoveryClassification)
  classification: RecoveryClassification;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  merchantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  merchantName: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  merchantPhone: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerPhone: string;

  @ApiProperty({ example: 250000, description: 'Current outstanding balance' })
  @IsNumber()
  @IsPositive()
  outstandingBalance: number;

  @ApiPropertyOptional({ example: 50000, description: 'Amount already paid; defaults to zero' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountPaid?: number;

  @ApiPropertyOptional({ example: 300000, description: 'Original debt amount' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amount?: number;

  @ApiProperty({ example: '2026-07-01', description: 'Due or default date' })
  @IsDateString()
  dueDate: Date;

  @ApiPropertyOptional({ example: '2026-06-15' })
  @IsOptional()
  @IsDateString()
  lastPaymentDate?: string;

  @ApiPropertyOptional({ example: '2026-01-01' })
  @IsOptional()
  @IsDateString()
  loanStartDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  product?: Product;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  agentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  supervisorId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  portfolioId?: string;

  @ApiPropertyOptional({ enum: RecoveryMode })
  @IsOptional()
  @IsEnum(RecoveryMode)
  recoveryMode?: RecoveryMode;

  @ApiPropertyOptional({ type: CaseTagDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CaseTagDto)
  tag?: CaseTagDto;

  @ApiPropertyOptional({ type: CaseFlagsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CaseFlagsDto)
  flags?: CaseFlagsDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  assetDetails?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  priorRecoveryAttempts?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  supportingDocuments?: string[];
}

export class AssignCaseDto {
  @ApiProperty()
  @IsOptional()
  @IsNotEmpty()
  staffId: string;
}

export class UpdateCaseDto extends PartialType(CreateCaseDto) {}
