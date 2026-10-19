import { ApiPropertyOptional } from '@nestjs/swagger';

import { QueryDto } from '@on/utils/dto/query.dto';

import { CaseStatus, RecoveryMode } from '../types/index.interface';

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

  @ApiPropertyOptional()
  hold?: boolean;

  @ApiPropertyOptional({ enum: RecoveryMode })
  recoveryMode?: RecoveryMode;
}
