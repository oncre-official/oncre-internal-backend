import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';
import { ObjectId } from 'mongodb';

import { ICreateStaff, StaffStatus } from '../types/index.interface';

export class CreateStaffDto implements ICreateStaff {
  @ApiProperty({ description: 'First name of the staff', example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name of the staff', example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Email address of the staff', example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Phone number of the staff', example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+\d{10,15}$/, {
    message: 'Phone number must start with a country code (e.g., +234) followed by 10-15 digits',
  })
  phone: string;

  @ApiPropertyOptional({ description: 'Residential or business address of the staff', example: 'Lagos, Nigeria' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ description: 'Current status of the staff', enum: StaffStatus, example: StaffStatus.ACTIVE })
  @IsEnum(StaffStatus)
  status: StaffStatus;

  @ApiProperty()
  @IsString()
  @IsOptional()
  roleId: ObjectId;
}
