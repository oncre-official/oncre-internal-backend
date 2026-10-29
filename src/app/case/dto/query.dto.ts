import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

import { QueryDto } from '@on/utils/dto/query.dto';

import { CaseSource, CaseStatus, NigerianZone, RecoveryClassification, RecoveryMode } from '../types/index.interface';

export class QueryCaseDto extends QueryDto {
  @ApiPropertyOptional()
  caseId?: string;

  @ApiPropertyOptional()
  merchantId?: string;

  @ApiPropertyOptional()
  customerId?: string;

  @ApiPropertyOptional()
  amount?: number;

  @ApiPropertyOptional({ enum: CaseStatus })
  status?: CaseStatus;

  @ApiPropertyOptional({ enum: NigerianZone })
  zone?: NigerianZone;

  @ApiPropertyOptional({ enum: RecoveryClassification })
  classification?: RecoveryClassification;

  @ApiPropertyOptional({ enum: CaseSource })
  source?: CaseSource;

  @ApiPropertyOptional()
  hold?: boolean;

  @ApiPropertyOptional({ enum: RecoveryMode })
  recoveryMode?: RecoveryMode;

  @ApiPropertyOptional()
  agentId?: string;

  @ApiPropertyOptional()
  supervisorId?: string;

  @ApiPropertyOptional({ description: 'Filter cases that have not been assigned to an agent', type: Boolean })
  @IsOptional()
  @Transform(({ value }) => (value === 'true' ? true : value === 'false' ? false : value))
  @IsBoolean()
  unassigned?: boolean;
}
