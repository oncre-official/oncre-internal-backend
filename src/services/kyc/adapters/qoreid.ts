import { Injectable, Logger } from '@nestjs/common';

import { QoreIdService } from '@on/services/qoreid/service';

import {
  IBusinessCheckRequest,
  IBusinessCheckResult,
  IKycPersonName,
  IKycProvider,
  INinCheckRequest,
  INinCheckResult,
  KycProviderName,
} from '../type';

function cleanName(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;

  const trimmed = value.trim().replace(/\s+/g, ' ');

  return trimmed ? trimmed.toUpperCase() : undefined;
}

/**
 * Reads QoreID's NIN answer. Verified only when QoreID completed the check, returned a record,
 * and the first and last name sent matched that record.
 */
export function parseQoreIdNin(response: any): INinCheckResult {
  const provider = KycProviderName.QOREID;
  const record = response?.nin ?? {};
  const check = response?.summary?.nin_check ?? {};
  const providerReference = response?.id !== undefined ? String(response.id) : undefined;

  const firstName = cleanName(record.firstname);
  const middleName = cleanName(record.middlename);
  const lastName = cleanName(record.lastname);

  const completed = response?.status?.status === 'verified';
  const namesMatch =
    check.status === 'EXACT_MATCH' || (check.fieldMatches?.firstname === true && check.fieldMatches?.lastname === true);

  if (!completed || !firstName || !lastName) {
    return { provider, verified: false, providerReference, failureReason: 'NIN record not found' };
  }

  if (!namesMatch) {
    return { provider, verified: false, providerReference, failureReason: 'Name does not match the NIN record' };
  }

  const name: IKycPersonName = {
    firstName,
    middleName,
    lastName,
    fullName: [firstName, middleName, lastName].filter(Boolean).join(' '),
  };

  return { provider, verified: true, name, providerReference };
}

/** The first field that has a value. QoreID's docs spell some CAC fields more than one way. */
function pick(record: any, ...keys: string[]): unknown {
  for (const key of keys) {
    const value = record?.[key];
    if (value !== undefined && value !== null && value !== '') return value;
  }

  return undefined;
}

/**
 * Reads QoreID's CAC answer. Verified only when QoreID completed the check, returned a company
 * name, and the company is ACTIVE on the register. Accepts camelCase and snake_case field names,
 * and any letter case in statuses.
 */
export function parseQoreIdCac(response: any, regNumber: string): IBusinessCheckResult {
  const provider = KycProviderName.QOREID;
  const record = response?.cac ?? response?.data?.cac ?? {};
  const providerReference = response?.id !== undefined ? String(response.id) : undefined;

  const legalName = cleanName(pick(record, 'companyName', 'company_name', 'name'));
  // The docs show rcNumber both as a string and as a number.
  const rawRcNumber = pick(record, 'rcNumber', 'rc_number', 'registrationNumber');
  const registrationNumber =
    cleanName(typeof rawRcNumber === 'number' ? String(rawRcNumber) : rawRcNumber) ?? regNumber;
  const registerStatus = cleanName(pick(record, 'status', 'companyStatus', 'company_status'));

  const completed = cleanName(response?.status?.status) === 'VERIFIED';

  if (!completed || !legalName) {
    return { provider, verified: false, providerReference, failureReason: 'Business record not found' };
  }

  if (registerStatus !== 'ACTIVE') {
    return {
      provider,
      verified: false,
      providerReference,
      failureReason: `Business is ${registerStatus ?? 'not active'} on CAC`,
    };
  }

  return { provider, verified: true, business: { legalName, registrationNumber }, providerReference };
}

@Injectable()
export class QoreIdKycAdapter implements IKycProvider {
  readonly name = KycProviderName.QOREID;

  private readonly logger = new Logger(QoreIdKycAdapter.name);

  constructor(private readonly qoreId: QoreIdService) {}

  async verifyNin(request: INinCheckRequest): Promise<INinCheckResult> {
    const response = await this.qoreId.verifyNin(request.nin, {
      firstname: request.firstName.trim(),
      lastname: request.lastName.trim(),
    });

    return parseQoreIdNin(response);
  }

  async verifyBusiness(request: IBusinessCheckRequest): Promise<IBusinessCheckResult> {
    const response = await this.qoreId.verifyCac(request.regNumber);
    const result = parseQoreIdCac(response, request.regNumber);

    // Field names only, never values: shows the real reply shape if it differs from the docs.
    if (!result.verified && result.failureReason === 'Business record not found') {
      this.logger.warn(
        `Unreadable QoreID CAC reply. Top-level fields: [${Object.keys(response ?? {}).join(', ')}], ` +
          `cac fields: [${Object.keys(response?.cac ?? {}).join(', ')}], status: ${JSON.stringify(response?.status?.status)}`,
      );
    }

    return result;
  }
}
