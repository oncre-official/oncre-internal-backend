export enum RecoveryClassification {
  MERCHANT = 'MERCHANT',
  FINANCIAL_INSTITUTION = 'FINANCIAL_INSTITUTION',
}

export enum RecoveryMode {
  ESCALATION = 'ESCALATION',
  PAYMENT_PLAN = 'PAYMENT_PLAN',
  COMPLETED = 'COMPLETED',
}

export enum CaseStatus {
  NEW_IMPORTED = 'NEW_IMPORTED',
  READY_FOR_CALLING = 'READY_FOR_CALLING',
  IN_CONTACT_ATTEMPT = 'IN_CONTACT_ATTEMPT',
  CONTACTED = 'CONTACTED',
  PROMISE_TO_PAY = 'PROMISE_TO_PAY',
  PAYMENT_MONITORING = 'PAYMENT_MONITORING',
  PART_PAYMENT_RECEIVED = 'PART_PAYMENT_RECEIVED',
  PLAN_BROKEN = 'PLAN_BROKEN',
  DISPUTE_REVIEW = 'DISPUTE_REVIEW',
  UNREACHABLE = 'UNREACHABLE',
  ESCALATION_REVIEW = 'ESCALATION_REVIEW',
  PAID_IN_FULL_CLOSED = 'PAID_IN_FULL_CLOSED',
}

export enum CaseFlag {
  DISPUTED = 'DISPUTED',
  DECEASED = 'DECEASED',
  LEGAL_PROCESS = 'LEGAL_PROCESS',
}

export enum CaseSource {
  MANUAL = 'MANUAL',
  BULK_IMPORT = 'BULK_IMPORT',
}

export interface IDebtorPhone {
  number: string;
  is_valid: boolean;
  is_primary?: boolean;
  data_review_required?: boolean;
}

export interface ICaseLocation {
  state_id: string;
  lga_id: string;
}

export interface ICaseFlags {
  disputed?: boolean;
  deceased?: boolean;
  in_legal_process?: boolean;
}

export interface ICaseAssetDetails {
  device_model?: string;
  serial_number?: string;
  lock_status?: string;
  [key: string]: unknown;
}

export interface ExcelCaseRow {
  merchantName?: string;
  merchantPhone?: string;
  customerName?: string;
  customerPhone?: string;
  classification?: string;
  outstandingBalance?: number | string;
  dueDate?: string | number | Date;
  product?: string;
  description?: string;
  disputed?: boolean | string;
  deceased?: boolean | string;
  inLegal: boolean | string;
  deviceModel: string;
  serialNumber: string;
}

export interface CaseUploadResult {
  row: number;
  status: 'success' | 'failed';
  message: string;
  caseId?: string;
  data?: Record<string, any>;
  errors?: string[];
}

export enum NigerianZone {
  NORTH_CENTRAL = 'NORTH_CENTRAL',
  NORTH_EAST = 'NORTH_EAST',
  NORTH_WEST = 'NORTH_WEST',
  SOUTH_EAST = 'SOUTH_EAST',
  SOUTH_SOUTH = 'SOUTH_SOUTH',
  SOUTH_WEST = 'SOUTH_WEST',
}
