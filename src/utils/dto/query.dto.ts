import { ApiPropertyOptional } from '@nestjs/swagger';

import { PaginationDto } from './pagination.dto';

export class QueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'The module id' })
  _id?: string;

  @ApiPropertyOptional({ description: 'The search parameter' })
  search?: string;

  @ApiPropertyOptional()
  startDate?: string;

  @ApiPropertyOptional()
  endDate?: string;
}
