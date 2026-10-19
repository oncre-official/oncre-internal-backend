import { Types } from 'mongoose';

export const normalizeMongoIds = (query: Record<string, any>) => {
  const parsedQuery: Record<string, any> = {};

  for (const [key, value] of Object.entries(query)) {
    if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
      parsedQuery[key] = new Types.ObjectId(value);
      continue;
    }

    if (Array.isArray(value)) {
      parsedQuery[key] = value.map((v) =>
        typeof v === 'string' && Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : v,
      );
      continue;
    }

    parsedQuery[key] = value;
  }

  return parsedQuery as any;
};

const normalizeAggregationValue = (value: any): any => {
  if (Array.isArray(value)) {
    return value.map((v) => normalizeAggregationValue(v));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, val]) => [key, normalizeAggregationValue(val)]));
  }

  if (typeof value === 'string' && Types.ObjectId.isValid(value)) {
    return new Types.ObjectId(value);
  }

  return value;
};

export const normalizeAggregationPipeline = (pipeline: any[]) => {
  return pipeline.map((stage) => normalizeAggregationValue(stage));
};

export function hasNestedPopulate(populate: any): boolean {
  if (Array.isArray(populate)) {
    return populate.some((p) => p.populate);
  }

  return !!populate.populate;
}
