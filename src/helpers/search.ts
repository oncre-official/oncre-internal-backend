export interface IJoinSearchConfig {
  from: string;
  localField: string;
  foreignField: string;
  as: string;
  searchFields?: string[];
  unwind?: boolean;
  nestedJoins?: IJoinSearchConfig[];
  pipeline?: any;
}
export interface IJoinSearchQuery {
  search?: string;
  fields?: string[];
  query?: Record<string, any>;
  joins?: IJoinSearchConfig[];
}

export const searchQuery = (fields: string[], searchParam: string, query?: Record<string, any>) => {
  const mappedFields = fields.map((field: string) => {
    return { [field]: { $regex: new RegExp(searchParam), $options: 'i' } };
  });

  delete query?.search;

  return { $or: mappedFields, ...query };
};

export const joinSearchQuery = (searchQuery: IJoinSearchQuery) => {
  const { search, fields = [], query = {}, joins = [] } = searchQuery;
  delete query?.search;

  const pipeline: any[] = [];

  if (Object.keys(query).length) pipeline.push({ $match: query });

  for (const join of joins) {
    const { from, localField, foreignField, as } = join;

    pipeline.push({ $lookup: { from, localField, foreignField, as } });
    if (join.unwind !== false) pipeline.push({ $unwind: { path: `$${as}`, preserveNullAndEmptyArrays: true } });
  }

  if (search) {
    const orConditions: any[] = [];

    for (const field of fields) {
      orConditions.push({ [field]: { $regex: search, $options: 'i' } });
    }

    for (const join of joins) {
      const { searchFields } = join;

      if (!searchFields) continue;

      for (const field of searchFields) {
        orConditions.push({
          [`${join.as}.${field}`]: { $regex: search, $options: 'i' },
        });
      }
    }

    if (orConditions.length) pipeline.push({ $match: { $or: orConditions } });
  }

  return pipeline;
};

export const joinSearchQueryNested = (searchQuery: IJoinSearchQuery): any[] => {
  const { search, fields = [], query = {}, joins = [] } = searchQuery;
  const pipeline: any[] = [];

  const q = { ...query };
  delete q.search;

  if (Object.keys(q).length) pipeline.push({ $match: q });

  const buildJoins = (joins: IJoinSearchConfig[] = [], parentAs?: string) => {
    for (const join of joins) {
      const { from, localField, foreignField, as, nestedJoins } = join;

      const local = parentAs ? `${parentAs}.${localField}` : localField;
      const alias = parentAs ? `${parentAs}.${as}` : as;

      pipeline.push({ $lookup: { from, localField: local, foreignField, as: alias } });

      if (join.unwind !== false) pipeline.push({ $unwind: { path: `$${alias}`, preserveNullAndEmptyArrays: true } });
      if (join.nestedJoins) buildJoins(nestedJoins, alias);
    }
  };

  buildJoins(joins);

  if (search) {
    const orConditions: any[] = [];
    for (const field of fields) orConditions.push({ [field]: { $regex: search, $options: 'i' } });

    const buildSearch = (joins: IJoinSearchConfig[] = [], parentAs?: string) => {
      for (const join of joins) {
        const { searchFields, as, nestedJoins } = join;

        const alias = parentAs ? `${parentAs}.${as}` : as;

        if (searchFields)
          for (const field of searchFields) {
            orConditions.push({ [`${alias}.${field}`]: { $regex: search, $options: 'i' } });
          }

        if (join.nestedJoins) buildSearch(nestedJoins, alias);
      }
    };

    buildSearch(joins);

    if (orConditions.length) pipeline.push({ $match: { $or: orConditions } });
  }

  return pipeline;
};
