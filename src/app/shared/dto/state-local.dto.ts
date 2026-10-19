import { ApiPropertyOptional } from '@nestjs/swagger';

export class StateQueryDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional()
  alias?: string;
}

export class LgaQueryDto extends StateQueryDto {
  @ApiPropertyOptional()
  stateId?: string;
}
