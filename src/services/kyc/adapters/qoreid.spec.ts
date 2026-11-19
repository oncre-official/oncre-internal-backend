import { parseQoreIdCac, parseQoreIdNin } from './qoreid';

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

describe('parseQoreIdCac', () => {
  const cacResponse = {
    id: 987,
    status: { state: 'complete', status: 'verified' },
    cac: { rcNumber: '123456', companyName: 'Acme Financial Services Limited', status: 'ACTIVE' },
  };

  it('accepts an ACTIVE business and returns its legal name', () => {
    expect(parseQoreIdCac(cacResponse, '123456')).toEqual({
      provider: 'qoreid',
      verified: true,
      providerReference: '987',
      business: { legalName: 'ACME FINANCIAL SERVICES LIMITED', registrationNumber: '123456' },
    });
  });

  it('rejects a business that is not ACTIVE on CAC', () => {
    const response = { ...cacResponse, cac: { ...cacResponse.cac, status: 'INACTIVE' } };
    expect(parseQoreIdCac(response, '123456')).toMatchObject({
      verified: false,
      failureReason: 'Business is INACTIVE on CAC',
    });
  });

  it('rejects an incomplete check or a missing record', () => {
    expect(parseQoreIdCac({ ...cacResponse, status: { status: 'not_found' } }, '123456').verified).toBe(false);
    expect(parseQoreIdCac({ ...cacResponse, cac: {} }, '123456').verified).toBe(false);
    expect(parseQoreIdCac(undefined, '123456').verified).toBe(false);
  });

  it('reads the reply shapes QoreID documents: numeric rcNumber, padded name, snake_case, any letter case', () => {
    const response = {
      id: 5,
      status: { state: 'complete', status: 'Verified' },
      cac: { rc_number: 11000011, company_name: 'TEST COMPANY   ', status: 'Active' },
    };
    expect(parseQoreIdCac(response, '11000011')).toMatchObject({
      verified: true,
      business: { legalName: 'TEST COMPANY', registrationNumber: '11000011' },
    });
  });
});
