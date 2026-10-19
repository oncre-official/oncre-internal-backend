import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsMongoId } from 'class-validator';

export class RolePermissionsDto {
  @ApiProperty({
    description: 'Array of permission IDs to assign to the role',
    example: ['64f1c2e5a1b2c3d4e5f6g7h8', '64f1c2e5a1b2c3d4e5f6g7h9'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsMongoId({ each: true })
  permissionIds: string[];
}
