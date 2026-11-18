import { parseQoreIdNin } from './qoreid';

jest.mock('@on/services/qoreid/service', () => ({ QoreIdService: class {} }));

const verifiedResponse = {
  id: 1234,
  status: { state: 'complete', status: 'verified' },
  summary: { nin_check: { status: 'EXACT_MATCH', fieldMatches: { firstname: true, lastname: true } } },
  nin: { firstname: 'Musa', middlename: ' adeyemi ', lastname: 'IBRAHIM' },
};

describe('parseQoreIdNin', () => {
  it('accepts a completed exact match and builds the name from the NIN record', () => {
    expect(parseQoreIdNin(verifiedResponse)).toEqual({
      provider: 'qoreid',
      verified: true,
      providerReference: '1234',
      name: { firstName: 'MUSA', middleName: 'ADEYEMI', lastName: 'IBRAHIM', fullName: 'MUSA ADEYEMI IBRAHIM' },
    });
  });

  it('accepts matching first and last name fields', () => {
    const response = {
      ...verifiedResponse,
      summary: { nin_check: { status: 'PARTIAL_MATCH', fieldMatches: { firstname: true, lastname: true } } },
    };
    expect(parseQoreIdNin(response).verified).toBe(true);
  });

  it('rejects a name mismatch', () => {
    const response = {
      ...verifiedResponse,
      summary: { nin_check: { status: 'NO_MATCH', fieldMatches: { firstname: false, lastname: true } } },
    };
    expect(parseQoreIdNin(response)).toMatchObject({
      verified: false,
      failureReason: 'Name does not match the NIN record',
    });
  });

  it('rejects an incomplete check or a missing record', () => {
    expect(parseQoreIdNin({ ...verifiedResponse, status: { state: 'complete', status: 'id_mismatch' } }).verified).toBe(
      false,
    );
    expect(parseQoreIdNin({ ...verifiedResponse, nin: {} }).verified).toBe(false);
    expect(parseQoreIdNin(undefined).verified).toBe(false);
  });
});
