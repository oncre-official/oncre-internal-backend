import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AgreementStatus, ReportingCadence } from '../types/index.interface';
import { IInstitutionDetails, IMerchantContact } from '../types/merchant.interface';

@Schema({ _id: false })
export class MerchantContact implements IMerchantContact {
  @ApiProperty({ description: 'Full name of the contact person', example: 'John Doe' })
  @Prop({ required: true })
  name: string;

  @ApiProperty({ description: 'Phone number of the contact person', example: '+2348012345678' })
  @Prop({ required: true })
  phone: string;

  @ApiProperty({ description: 'Email address of the contact person', example: 'john@example.com' })
  @Prop({ required: true })
  email: string;

  @ApiPropertyOptional({ description: 'Designation of the contact person', example: 'Operations Manager' })
  @Prop()
  designation?: string;
}

export const MerchantContactSchema = SchemaFactory.createForClass(MerchantContact);

@Schema({ _id: false })
export class InstitutionAgreement {
  @ApiProperty({ description: 'Reference identifying the institution agreement', example: 'AGR-2026-001' })
  @Prop({ required: true })
  reference: string;

  @ApiProperty({ description: 'Date of the institution agreement', example: '2026-10-15', type: Date })
  @Prop({ required: true, type: Date })
  date: Date;

  @ApiProperty({ description: 'Current status of the institution agreement', enum: AgreementStatus })
  @Prop({ required: true, enum: AgreementStatus, type: String })
  status: AgreementStatus;
}

export const InstitutionAgreementSchema = SchemaFactory.createForClass(InstitutionAgreement);

@Schema({ _id: false })
export class InstitutionContact {
  @ApiProperty({ description: 'Primary contact for the institution', type: () => MerchantContact })
  @Prop({ type: MerchantContactSchema, required: true })
  primary: MerchantContact;

  @ApiProperty({ description: 'Additional contacts for the institution', type: () => [MerchantContact] })
  @Prop({ type: [MerchantContactSchema], default: [] })
  additional: MerchantContact[];
}

export const InstitutionContactSchema = SchemaFactory.createForClass(InstitutionContact);

@Schema({ _id: false })
export class InstitutionDetails implements IInstitutionDetails {
  @ApiProperty({ description: 'Legal name of the institution', example: 'Acme Financial Services Limited' })
  @Prop({ required: true })
  legalName: string;

  @ApiProperty({ description: 'Institution registration number', example: 'RC123456' })
  @Prop({ required: true })
  registrationNo: string;

  @ApiProperty({ description: 'Institution contact information', type: () => InstitutionContact })
  @Prop({ type: InstitutionContactSchema, required: true })
  contact: InstitutionContact;

  @ApiProperty({ description: 'Institution agreement details', type: () => InstitutionAgreement })
  @Prop({ type: InstitutionAgreementSchema, required: true })
  agreement: InstitutionAgreement;

  @ApiPropertyOptional({ description: 'Reference to the agreed fee terms', example: 'FEE-TERMS-001' })
  @Prop()
  feeTermsReference?: string;

  @ApiProperty({ description: 'Reporting frequency for the institution', enum: ReportingCadence })
  @Prop({ required: true, enum: ReportingCadence, type: String })
  reportingCadence: ReportingCadence;

  @ApiProperty({ description: 'Display name of the institution', example: 'Acme Financial' })
  @Prop({ required: true })
  displayName: string;

  @ApiPropertyOptional({ description: 'Reporting template identifier or name', example: 'standard-monthly-report' })
  @Prop()
  reportTemplate?: string;

  @ApiPropertyOptional({
    description: 'URL or path to the signed agreement',
    example: 'https://example.com/agreements/signed-agreement.pdf',
  })
  @Prop()
  signedAgreement?: string;

  @ApiPropertyOptional({
    description: 'Regions covered by the institution',
    type: [String],
    example: ['Lagos', 'Abuja', 'Rivers'],
  })
  @Prop({ type: [String], default: undefined })
  regions?: string[];
}

export const InstitutionDetailsSchema = SchemaFactory.createForClass(InstitutionDetails);
