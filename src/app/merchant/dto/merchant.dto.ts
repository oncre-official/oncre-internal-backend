import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf, ValidateNested } from 'class-validator';

import { MerchantChannel, MerchantType } from '../types/index.interface';
import { ICreateMerchant } from '../types/merchant.interface';

import { InstitutionDto } from './institution.dto';

export class CreateMerchantDto implements ICreateMerchant {
  @ApiProperty({ description: 'Personal name of the merchant', example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Store name of the merchant', example: "John's Store" })
  @IsString()
  @IsNotEmpty()
  storeName: string;

  @ApiProperty({ description: 'Phone number of the merchant', example: '+1234567890' })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiPropertyOptional({ description: 'Email address of the merchant', example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Location of the merchant', example: 'New York, NY' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ description: 'Type of merchant', enum: MerchantType, example: MerchantType.FINANCIAL_INSTITUTION })
  @IsEnum(MerchantType)
  type: MerchantType;

  @ApiPropertyOptional({ description: 'Channel used by the merchant', enum: MerchantChannel })
  @IsOptional()
  @IsEnum(MerchantChannel)
  channel?: MerchantChannel;

  @ApiPropertyOptional({
    description: 'Registration details for a financial institution',
    type: () => InstitutionDto,
  })
  @ValidateIf((dto: CreateMerchantDto) => dto.type === MerchantType.FINANCIAL_INSTITUTION)
  @ValidateNested()
  @Type(() => InstitutionDto)
  institutionDetails?: InstitutionDto;
}

export class MerchantDto extends CreateMerchantDto {
  @ApiProperty({ description: 'Unique identifier for the merchant', example: 'MER-00001' })
  @IsString()
  @IsNotEmpty()
  merchantId: string;
}
