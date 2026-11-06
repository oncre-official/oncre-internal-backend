import { calculateStartAndEndOfDay } from './date';
import { normalizeMongoIds } from './db';

export interface RequestFilterOptions {
  dateField?: string;
  convertToRegex?: boolean;
}

export function requestFilter(data: Record<string, any>, options: RequestFilterOptions = {}) {
  if (!data) return data;

  const { dateField = 'createdAt', convertToRegex = true } = options;

  delete data.skip;
  delete data.limit;

  const normalized = normalizeMongoIds(data);

  const { startDate, endDate, ...rest } = normalized;
  const filter: Record<string, any> = { ...rest };

  Object.keys(filter).forEach((key) => {
    const value = filter[key];

    if (typeof value === 'string') {
      const lower = value.toLowerCase().trim();

      if (lower === 'true') filter[key] = true;
      else if (lower === 'false') filter[key] = false;
    }
  });

  if (startDate || endDate) {
    const { start, end } = calculateStartAndEndOfDay(startDate, endDate);

    filter[dateField] = {
      ...(filter[dateField] || {}),
      ...(startDate ? { $gte: start } : {}),
      ...(endDate ? { $lte: end } : {}),
    };
  }

  if (!convertToRegex) return filter;

  Object.keys(filter).forEach((key) => {
    const value = filter[key];

    if (typeof value === 'string' && key !== dateField) {
      filter[key] = { $regex: value, $options: 'i' };
    }
  });

  return filter;
}
