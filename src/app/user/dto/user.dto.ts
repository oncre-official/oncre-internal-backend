import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsMongoId } from 'class-validator';
import { ObjectId } from 'mongodb';

export class UserDto {
  @ApiProperty({ description: 'User Country Code' })
  @IsString()
  countryCode: string;

  @ApiProperty({ description: 'User Phone Number' })
  @IsString()
  phone: string;

  @ApiProperty({ description: 'User Email' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ description: 'User Role Id' })
  @IsMongoId()
  roleId: ObjectId;

  @ApiProperty({ description: 'User Password' })
  @IsString()
  password: string;
}
