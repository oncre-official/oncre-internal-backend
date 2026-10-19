import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  roleId?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  remove?: boolean;
}
