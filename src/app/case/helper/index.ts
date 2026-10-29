import { requestFilter, RequestFilterOptions } from '@on/helpers/filter';

import { CaseAssignmentStatus } from '../dto/query.dto';
import { Case } from '../model/case.model';

export function isCaseOnHold(newCase: Case) {
  if (!newCase.hold) return false;
  if (!newCase.holdUntil) return false;

  return new Date(newCase.holdUntil) > new Date();
}

export function getEscalationLevel(day: number): number {
  if (day <= 3) return 1;
  if (day <= 7) return 2;
  if (day <= 14) return 3;
  return 4;
}

export function caseRequestFilter(data: Record<string, any>, options: RequestFilterOptions = {}) {
  if (!data) return data;

  const { assignmentStatus, ...query } = data;

  const filter = requestFilter(query, options);

  if (assignmentStatus === CaseAssignmentStatus.ASSIGNED) {
    filter.agentId = { $exists: true, $nin: [null, ''] };
  }

  if (assignmentStatus === CaseAssignmentStatus.UNASSIGNED) {
    filter.$or = [{ agentId: null }, { agentId: { $exists: false } }, { agentId: '' }];
  }

  delete filter?.assignmentStatus;

  return filter;
}
