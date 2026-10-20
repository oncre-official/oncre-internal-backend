export enum MerchantType {
  STANDARD = 'standard',
  FINANCIAL_INSTITUTION = 'financial_institution',
}

export enum MerchantStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  IN_ACTIVE = 'in_active',
  SUSPENDED = 'suspended',
}

export enum Product {
  DIRECT_INVOICE = 'direct_invoice',
  ONBUFFAH = 'onbuffah',
  TRADE_CREDIT = 'trade_credit',
}

export enum MerchantChannel {
  MERCHANT_PORTAL = 'merchant_portal',
  LANDING_PAGE = 'landing_page',
  AGENT_ONBOARDING = 'agent_onboarding',
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OTHER = 'other',
}

export enum AgreementStatus {
  PENDING = 'pending',
  SIGNED = 'signed',
  EXPIRED = 'expired',
  TERMINATED = 'terminated',
}

export enum ReportingCadence {
  WEEKLY = 'weekly',
  FORTNIGHTLY = 'fortnightly',
  MONTHLY = 'monthly',
  ON_REQUEST = 'on_request',
}
