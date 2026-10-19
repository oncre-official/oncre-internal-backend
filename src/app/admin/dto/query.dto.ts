import { ApiPropertyOptional } from '@nestjs/swagger';

import { QueryDto } from '@on/utils/dto/query.dto';

export class QueryUserDto extends QueryDto {
  @ApiPropertyOptional()
  roleId?: string;
}
