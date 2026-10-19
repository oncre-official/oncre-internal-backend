import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, Matches } from 'class-validator';

import { ICreateCustomer } from '../types/customer.interface';

export class CreateCustomerDto implements ICreateCustomer {
  @ApiProperty({ description: 'Personal name of the customer', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ description: 'Personal name of the customer', example: 'John Doe' })
  @IsString()
  @IsOptional()
  businessName: string;

  @ApiProperty({ description: 'Phone number of the customer', example: '+2348012345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+\d{10,15}$/, {
    message: 'Phone number must start with a country code (e.g., +234) followed by 10-15 digits',
  })
  phone: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;
}

export class CustomerDto extends CreateCustomerDto {
  @ApiProperty({ description: 'Unique identifier for the customer', example: 'CUS-00001' })
  @IsString()
  @IsNotEmpty()
  customerId: string;
}
