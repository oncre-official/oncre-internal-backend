import { ApiPropertyOptional } from '@nestjs/swagger';

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
}
