import { ObjectId } from 'mongodb';
import { Model, PopulateOptions, UpdateResult, ClientSession } from 'mongoose';

import { hasNestedPopulate, normalizeMongoIds } from '@on/helpers/db';

export interface AggregateOption {
  limit?: number;
  skip?: number;
}

type GenericRecord = Record<string, any> | any;

interface Options {
  aggregate?: AggregateOption;
  populate?: PopulateOptions[];
  sort?: { [key: string]: number };
  select?: string[];
  projection?: { [key: string]: number };
  pipeline?: any[];
  new?: boolean;
  upsert?: boolean;
  lean?: boolean;
  returnDocument?: 'after' | 'before';
  session?: ClientSession;
  useLookup?: boolean;
  setDefaultsOnInsert?: boolean;
}

export class BaseRepository<T> {
  constructor(private readonly repository: Model<T>) {}

  async find(query?: GenericRecord, options?: Options): Promise<T[]> {
    const parsedQuery = normalizeMongoIds(query);

    return await this.queryBuilder(parsedQuery, options?.populate, options?.sort, options?.session).exec();
  }

  async findOne(query: GenericRecord, options?: Options): Promise<T> {
    const parsedQuery = normalizeMongoIds(query);

    let queryBuilder: any = this.repository.findOne(parsedQuery);

    if (options?.populate) queryBuilder = queryBuilder.populate(options.populate);
    if (options?.session) queryBuilder = queryBuilder.session(options.session);

    return await queryBuilder.exec();
  }

  async findById(id: string | ObjectId, options?: Options): Promise<T> {
    const objectId = new ObjectId(String(id));
    let queryBuilder: any = this.repository.findById(objectId);

    if (options?.populate) queryBuilder = queryBuilder.populate(options.populate);
    if (options?.session) queryBuilder = queryBuilder.session(options.session);

    return await queryBuilder.exec();
  }

  async findAndCount(query: GenericRecord, options?: Options): Promise<{ row: T[]; count: number }> {
    const parsedQuery = normalizeMongoIds(query);

    const dataQueryBuilder = this.queryBuilder(parsedQuery, options?.populate, options?.sort, options?.session);
    const countQueryBuilder = this.repository.find(parsedQuery).session(options?.session || null);

    const [data, count] = await Promise.all([
      dataQueryBuilder
        .select(options?.select || '')
        .skip(options?.aggregate?.skip || 0)
        .limit(options?.aggregate?.limit || 0)
        .exec(),
      countQueryBuilder.countDocuments().exec(),
    ]);

    return { row: data, count };
  }

  async findOneOrCreate(query: GenericRecord, payload: GenericRecord = {}, options?: Options): Promise<T> {
    const parsedQuery = normalizeMongoIds(query);
    const parsedPayload = normalizeMongoIds(payload);

    let queryBuilder: any = this.repository.findOne(parsedQuery);
    if (options?.populate) queryBuilder = queryBuilder.populate(options.populate);

    const existing = await queryBuilder.exec();
    if (existing) return existing;

    const document = await this.repository.create({
      ...parsedQuery,
      ...parsedPayload,
    });

    if (!options?.populate) return document;

    return (await this.repository
      .findById((document as any)._id)
      .populate(options.populate)
      .exec()) as T;
  }

  async findOneAndCreate(query: GenericRecord, payload: GenericRecord, options?: Options): Promise<T> {
    const parsedQuery = normalizeMongoIds(query);

    const parsedPayload = normalizeMongoIds(payload);

    let queryBuilder: any = this.repository.findOneAndUpdate(
      parsedQuery,
      { $setOnInsert: parsedPayload },
      {
        returnDocument: 'after',
        upsert: true,
        session: options?.session,
      },
    );

    if (options?.populate) queryBuilder = queryBuilder.populate(options?.populate);

    return await queryBuilder.exec();
  }

  async findOneAndUpdate(query: GenericRecord, payload: GenericRecord, options: Options = {}): Promise<T | null> {
    const parsedQuery = normalizeMongoIds(query);

    const parsedPayload = normalizeMongoIds(payload);

    let queryBuilder = this.repository.findOneAndUpdate(parsedQuery, parsedPayload, {
      returnDocument: options.returnDocument ?? 'after',
      upsert: options.upsert ?? false,
      lean: options.lean ?? false,
      select: options.select,
      session: options.session,
    });

    if (options.populate) queryBuilder = queryBuilder.populate(options.populate);

    return await queryBuilder.exec();
  }

  async aggregate(query: any, options?: Options): Promise<T[] | any> {
    const aggregationPipeline: any[] = query;
    const option = options?.aggregate;

    if (option && option.limit !== undefined) aggregationPipeline.push({ $limit: Number(option.limit) });
    if (option && option.skip !== undefined) aggregationPipeline.push({ $skip: Number(option.skip) });

    let aggregate = this.repository.aggregate(aggregationPipeline);
    if (options?.session) aggregate = aggregate.session(options.session);

    return await aggregate.exec();
  }

  async distinct(field: string, query?: GenericRecord, options?: Options): Promise<any[]> {
    const parsedQuery = normalizeMongoIds(query || {});

    let distinctQuery = this.repository.distinct(field, parsedQuery);
    if (options?.session) distinctQuery = distinctQuery.session(options.session);

    return await distinctQuery.exec();
  }

  async count(query?: GenericRecord, options?: Options): Promise<number> {
    const parsedQuery = normalizeMongoIds(query || {});

    let countQuery = this.repository.countDocuments(parsedQuery);
    if (options?.session) countQuery = countQuery.session(options.session);

    return await countQuery.exec();
  }

  async aggregateAndCount(pipeline: any[] = [], options?: Options): Promise<{ row: T[]; count: number }> {
    const skip = Number(options?.aggregate?.skip || 0);
    const limit = Number(options?.aggregate?.limit || 0);

    const session = options?.session;
    const populate = options?.populate;
    const useLookup = options?.useLookup ?? false;

    const fullPipeline = [...pipeline];

    if (populate && useLookup) {
      const lookups: any = Array.isArray(populate) ? populate : [populate];

      for (const pop of lookups) {
        if (pop.populate) continue;

        const lookupStage = {
          $lookup: {
            from: pop.from || pop.path,
            localField: pop.localField || pop.path,
            foreignField: pop.foreignField || '_id',
            as: pop.as || pop.path,
          },
        };

        fullPipeline.push(lookupStage);

        if (pop.unwind !== false) {
          fullPipeline.push({
            $unwind: { path: `$${pop.as || pop.path}`, preserveNullAndEmptyArrays: true },
          });
        }
      }
    }

    const countPipeline = [...fullPipeline, { $count: 'count' }];
    let countAggregate = this.repository.aggregate(countPipeline);
    if (session) countAggregate = countAggregate.session(session);

    const countResult = await countAggregate.exec();
    const count = countResult[0]?.count || 0;

    const dataPipeline = [...fullPipeline];

    if (skip) dataPipeline.push({ $skip: skip });
    if (limit) dataPipeline.push({ $limit: limit });

    let dataAggregate = this.repository.aggregate(dataPipeline);
    if (session) dataAggregate = dataAggregate.session(session);

    let data = await dataAggregate.exec();

    if (populate && data.length > 0) {
      if (!useLookup || hasNestedPopulate(populate)) {
        data = await this.repository.populate(data, populate);
      }
    }

    return { row: data, count };
  }

  async create(payload: GenericRecord, options?: Options): Promise<T> {
    const parsedPayload = normalizeMongoIds(payload);

    if (options?.session) {
      const [doc] = await this.repository.create([parsedPayload], { session: options.session });

      return doc;
    }

    return await this.repository.create(parsedPayload);
  }

  async createMany(payload: GenericRecord[], options?: Options): Promise<T[] | any> {
    const parsedPayload = payload.map((item) => normalizeMongoIds(item));

    if (options?.session) {
      return await this.repository.insertMany(parsedPayload, { session: options.session });
    }

    return await this.repository.insertMany(parsedPayload);
  }

  async updateOne(query: GenericRecord, update: GenericRecord, options?: Options): Promise<T | null> {
    const parsedQuery = normalizeMongoIds(query);
    const parsedUpdate = normalizeMongoIds(update);

    return await this.repository
      .findOneAndUpdate(parsedQuery, parsedUpdate, {
        returnDocument: 'after',
        session: options?.session,
      })
      .exec();
  }

  async updateMany(query: GenericRecord, update: GenericRecord, options?: Options): Promise<UpdateResult> {
    const parsedQuery = normalizeMongoIds(query);
    const parsedUpdate = normalizeMongoIds(update);

    let updateQuery = this.repository.updateMany(parsedQuery, parsedUpdate);

    if (options?.session) {
      updateQuery = updateQuery.session(options.session);
    }

    return await updateQuery.exec();
  }

  async upsert(query: GenericRecord, update: GenericRecord, options?: Options): Promise<void> {
    const parsedQuery = normalizeMongoIds(query);
    const parsedUpdate = normalizeMongoIds(update);

    const updateQuery = this.repository.updateOne(parsedQuery, parsedUpdate, {
      upsert: true,
      session: options?.session,
    });

    await updateQuery.exec();
  }

  async updateById(
    id: string | ObjectId,
    update: GenericRecord,
    options?: GenericRecord & { session?: ClientSession },
  ): Promise<T | any> {
    const objectId = typeof id === 'string' ? new ObjectId(id) : id;
    const parsedUpdate = normalizeMongoIds(update);

    return await this.repository
      .findByIdAndUpdate(objectId, parsedUpdate, {
        returnDocument: 'after',
        ...options,
      })
      .exec();
  }

  async deleteOne(query: GenericRecord, options?: Options): Promise<void> {
    const parsedQuery = normalizeMongoIds(query);

    let deleteQuery = this.repository.deleteOne(parsedQuery);
    if (options?.session) deleteQuery = deleteQuery.session(options.session);

    await deleteQuery.exec();
  }

  async deleteById(id: string | ObjectId, options?: Options): Promise<void> {
    const objectId = new ObjectId(String(id));

    let deleteQuery = this.repository.findByIdAndDelete(objectId);
    if (options?.session) deleteQuery = deleteQuery.session(options.session);

    await deleteQuery.exec();
  }

  async deleteMany(query: GenericRecord, options?: Options): Promise<void> {
    const parsedQuery = normalizeMongoIds(query);

    let deleteQuery = this.repository.deleteMany(parsedQuery);
    if (options?.session) deleteQuery = deleteQuery.session(options.session);

    await deleteQuery.exec();
  }

  /**
   * PRIVATE METHODS
   */

  private queryBuilder(
    query: GenericRecord = {},
    populateOptions?: PopulateOptions[],
    sortOptions?: { [key: string]: number },
    session?: ClientSession,
    projectionOptions?: { [key: string]: number },
  ): any {
    let queryBuilder: any = this.repository.find(query, projectionOptions);

    if (populateOptions) queryBuilder = queryBuilder.populate(populateOptions);
    if (session) queryBuilder = queryBuilder.session(session);

    const defaultSortField = 'createdAt';
    const defaultSortDirection = -1;
    const finalSortOptions = sortOptions || {
      [defaultSortField]: defaultSortDirection,
    };

    queryBuilder = queryBuilder.sort(finalSortOptions);

    return queryBuilder;
  }
}
