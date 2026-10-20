import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsDateString, IsEmail, IsEnum, IsOptional, IsString, ValidateNested } from 'class-validator';

import { AgreementStatus, ReportingCadence } from '../types/index.interface';
import { IInstitutionDetails, IMerchantContact } from '../types/merchant.interface';

export class MerchantContactDto implements IMerchantContact {
  @ApiProperty({ description: 'Full name of the institution contact', example: 'John Doe' })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Phone number of the institution contact', example: '+2348012345678' })
  @IsString()
  @IsOptional()
  phone: string;

  @ApiProperty({ description: 'Email address of the institution contact', example: 'john@example.com' })
  @IsEmail()
  @IsOptional()
  email: string;

  @ApiPropertyOptional({ description: 'Designation or job title of the contact', example: 'Operations Manager' })
  @IsOptional()
  @IsString()
  designation?: string;
}

export class InstitutionContactDto {
  @ApiProperty({ description: 'Primary institution contact', type: () => MerchantContactDto })
  @ValidateNested()
  @Type(() => MerchantContactDto)
  primary: MerchantContactDto;

  @ApiProperty({
    description: 'Additional institution contacts',
    type: () => [MerchantContactDto],
    example: [
      {
        name: 'Jane Doe',
        phone: '+2348098765432',
        email: 'jane@example.com',
        designation: 'Finance Manager',
      },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MerchantContactDto)
  additional: MerchantContactDto[];
}

export class InstitutionAgreementDto {
  @ApiProperty({ description: 'Reference identifying the institution agreement', example: 'AGR-2026-001' })
  @IsString()
  reference: string;

  @ApiProperty({
    description: 'Date of the institution agreement',
    example: '2026-10-15',
    type: String,
    format: 'date',
  })
  @IsDateString()
  date: Date;

  @ApiProperty({ description: 'Current status of the institution agreement', enum: AgreementStatus })
  @IsEnum(AgreementStatus)
  status: AgreementStatus;
}

export class InstitutionDto implements IInstitutionDetails {
  @ApiProperty({ description: 'Legal name of the institution', example: 'Acme Financial Services Limited' })
  @IsString()
  @IsOptional()
  legalName: string;

  @ApiProperty({ description: 'Institution registration number', example: 'RC123456' })
  @IsString()
  registrationNo: string;

  @ApiProperty({ description: 'Institution contact details', type: () => InstitutionContactDto })
  @ValidateNested()
  @Type(() => InstitutionContactDto)
  contact: InstitutionContactDto;

  @ApiProperty({ description: 'Institution agreement details', type: () => InstitutionAgreementDto })
  @ValidateNested()
  @Type(() => InstitutionAgreementDto)
  agreement: InstitutionAgreementDto;

  @ApiPropertyOptional({
    description: 'Reference to the agreed fee terms',
    example: 'FEE-TERMS-001',
  })
  @IsOptional()
  @IsString()
  fee_terms_reference?: string;

  @ApiProperty({ description: 'Frequency of institution reporting', enum: ReportingCadence })
  @IsEnum(ReportingCadence)
  reportingCadence: ReportingCadence;

  @ApiProperty({ description: 'Display name of the institution', example: 'Acme Financial' })
  @IsString()
  displayName: string;

  @ApiPropertyOptional({ description: 'Reporting template identifier or name', example: 'standard-monthly-report' })
  @IsOptional()
  @IsString()
  reportTemplate?: string;

  @ApiPropertyOptional({
    description: 'URL or path to the signed agreement',
    example: 'https://example.com/agreements/signed-agreement.pdf',
  })
  @IsOptional()
  @IsString()
  signedAgreement?: string;

  @ApiPropertyOptional({
    description: 'Regions covered by the institution',
    type: [String],
    example: ['Lagos', 'Abuja', 'Rivers'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];
}
