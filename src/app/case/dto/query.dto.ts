import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { QueryDto } from '@on/utils/dto/query.dto';

import { CaseSource, CaseStatus, NigerianZone, RecoveryClassification, RecoveryMode } from '../types/index.interface';

export enum CaseAssignmentStatus {
  ASSIGNED = 'assigned',
  UNASSIGNED = 'unassigned',
}

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

  @ApiPropertyOptional({ enum: CaseAssignmentStatus, description: 'Filter cases by agent assignment status' })
  @IsOptional()
  @IsEnum(CaseAssignmentStatus)
  assignmentStatus?: CaseAssignmentStatus;
}
