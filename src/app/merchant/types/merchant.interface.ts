import { ObjectId } from 'mongodb';

import { IBaseType } from '@on/utils/types';

import {
  AgreementStatus,
  MerchantChannel,
  MerchantStatus,
  MerchantType,
  Product,
  ReportingCadence,
} from './index.interface';

export interface IMerchantContact {
  name: string;
  phone: string;
  email: string;
  designation?: string;
}

export interface IInstitutionDetails {
  legal_name: string;
  registration_no: string;
  contact: {
    primary: IMerchantContact;
    additional: IMerchantContact[];
  };
  agreement: {
    reference: string;
    date: Date;
    status: AgreementStatus;
  };
  fee_terms_reference?: string;
  reporting_cadence: ReportingCadence;
  display_name: string;
  report_template?: string;
  signed_agreement?: string;
  regions?: string[];
}

export interface IMerchant extends IBaseType {
  userId?: ObjectId;
  createdBy: ObjectId;
  merchantId: string;
  name: string;
  storeName?: string;
  phone: string;
  email?: string;
  location?: string;
  type: MerchantType;
  channel: MerchantChannel;
  product: Product;
  status: MerchantStatus;
  activatedAt?: Date;
  institutionDetails?: IInstitutionDetails;
}

export interface ICreateMerchant {
  name: string;
  storeName?: string;
  phone: string;
  email?: string;
  location?: string;
  type?: MerchantType;
  channel?: MerchantChannel;
  userId?: ObjectId;
  createdBy?: ObjectId;
  institutionDetails?: IInstitutionDetails;
}

export interface IUpdateMerchant {
  name?: string;
  storeName?: string;
  phone?: string;
  email?: string;
  location?: string;
  channel?: MerchantChannel;
  is_active?: boolean;
  institutionDetails?: Partial<IInstitutionDetails>;
}
