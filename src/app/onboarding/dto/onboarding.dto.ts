import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MaxLength } from 'class-validator';

export class MerchantSignupDto {
  @ApiProperty({ description: 'Phone number of the merchant', example: '08012345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9\s-]{10,16}$/, { message: 'phone must be a valid phone number' })
  phone: string;
}

export class VerifyMerchantPhoneDto extends MerchantSignupDto {
  @ApiProperty({ description: 'Six-digit code sent by SMS', example: '482913' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp must be 6 digits' })
  otp: string;
}

export class VerifyNinDto {
  @ApiProperty({ description: 'National Identification Number (11 digits)', example: '12345678901' })
  @IsString()
  @Matches(/^\d{11}$/, { message: 'nin must be 11 digits' })
  nin: string;

  @ApiProperty({ description: 'First name as on the NIN record', example: 'Musa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  firstName: string;

  @ApiProperty({ description: 'Last name as on the NIN record', example: 'Ibrahim' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  lastName: string;
}

export class MerchantLoginDto {
  @ApiProperty({ description: 'Phone number the merchant signed up with', example: '08012345678' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[0-9\s-]{10,16}$/, { message: 'phone must be a valid phone number' })
  phone: string;
}

export class VerifyMerchantLoginDto extends MerchantLoginDto {
  @ApiProperty({ description: 'Six-digit code sent by SMS', example: '482913' })
  @IsString()
  @Matches(/^\d{6}$/, { message: 'otp must be 6 digits' })
  otp: string;
}
