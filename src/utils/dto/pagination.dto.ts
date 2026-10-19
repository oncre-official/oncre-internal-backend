import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiPropertyOptional({ description: 'The offset number' })
  skip?: number;

  @ApiPropertyOptional({ description: 'The number of limit' })
  limit?: number;
}
