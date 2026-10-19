import { ApiHideProperty, ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEmail, IsMongoId, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongodb';

export class UserProfileDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsOptional()
  @IsMongoId()
  supervisorId: ObjectId;
}

export class AdminCreateUserDto extends UserProfileDto {
  @ApiProperty()
  @IsOptional()
  @IsString()
  countryCode: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  phone: string;

  @ApiPropertyOptional()
  @IsEmail()
  email?: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsMongoId()
  roleId: string;

  @ApiHideProperty()
  password: string;
}

export class AdminUpdateUserDto extends PartialType(AdminCreateUserDto) {}
