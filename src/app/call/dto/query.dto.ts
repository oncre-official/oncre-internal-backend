import { ApiPropertyOptional } from '@nestjs/swagger';

import { QueryDto } from '@on/utils/dto/query.dto';

export class QueryCallDto extends QueryDto {
  @ApiPropertyOptional()
  caseId?: string;

  @ApiPropertyOptional()
  merchantId?: string;

  @ApiPropertyOptional()
  customerId?: string;

  @ApiPropertyOptional()
  day?: number;
}
