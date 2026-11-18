import { Injectable } from '@nestjs/common';

import { QoreIdService } from '@on/services/qoreid/service';

import { IKycPersonName, IKycProvider, INinCheckRequest, INinCheckResult, KycProviderName } from '../type';

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

@Injectable()
export class QoreIdKycAdapter implements IKycProvider {
  readonly name = KycProviderName.QOREID;

  constructor(private readonly qoreId: QoreIdService) {}

  async verifyNin(request: INinCheckRequest): Promise<INinCheckResult> {
    const response = await this.qoreId.verifyNin(request.nin, {
      firstname: request.firstName.trim(),
      lastname: request.lastName.trim(),
    });

    return parseQoreIdNin(response);
  }
}
