import { ObjectId } from 'mongodb';

import { Product } from '@on/app/merchant/types/index.interface';
import { IBaseType } from '@on/utils/types';

import {
  CaseSource,
  CaseStatus,
  ICaseAssetDetails,
  ICaseFlags,
  NigerianZone,
  RecoveryClassification,
  RecoveryMode,
} from './index.interface';

export interface ICase extends IBaseType {
  caseId: string;
  merchantId: ObjectId;
  customerId: ObjectId;

  classification: RecoveryClassification;
  zone: NigerianZone;

  outstandingBalance: number;
  amountPaid: number;
  amount: number;
  dueDate: Date;
  debtAge: number;
  lastPaymentDate?: Date;
  loanStartDate?: Date;
  product: Product;
  description: string;

  status: CaseStatus;
  nextAction: string;
  nextActionAt: Date;
  agentId: ObjectId;
  supervisorId: ObjectId;

  source: CaseSource;
  batchId: string;
  tag: {
    campaign?: string;
    product?: string;
    location?: string;
    debtAage?: string;
  };

  flags?: ICaseFlags;
  assetDetails?: ICaseAssetDetails;
  priorRecoveryAttempts?: string;
  supportingDocuments?: string[];

  recoveryMode?: RecoveryMode;
  paymentPlanId?: string;

  paused: boolean;
  hold?: boolean;
  holdUntil?: Date;
  pauseReason?: string;
  pausedAt?: Date;
  pausedAtDay?: number;
  pausedAtLevel?: number;

  activatedAt?: Date;
  recoveredAt?: Date;
  closedAt?: Date;
}
