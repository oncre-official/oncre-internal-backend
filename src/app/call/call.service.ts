import { Injectable } from '@nestjs/common';

import { joinSearchQuery } from '@on/helpers/search';
import { ServiceResponse } from '@on/utils/types';

import { QueryCallDto } from './dto/query.dto';
import { CallRepository } from './repository/call.repository';
import { CallScheduleStatus } from './types/index.interface';

@Injectable()
export class CallService {
  constructor(private readonly call: CallRepository) {}

  async find(query: QueryCallDto, skip: number = 0, limit: number = 20): Promise<ServiceResponse<any>> {
    const { search } = query;

    const joinQuery = joinSearchQuery({
      search,
      fields: [],
      query,
      joins: [],
    });

    const strategies = {
      search: () => this.call.aggregateAndCount(joinQuery, { aggregate: { skip, limit } }),
      normal: () =>
        this.call.findAndCount(query, {
          aggregate: { skip, limit },
          populate: [{ path: 'case' }],
          sort: { createdAt: -1 },
        }),
    };

    const data = search ? await strategies.search() : await strategies.normal();

    return { data, message: 'calls successfully fetched' };
  }

  async queue(query: Record<string, any>, skip: number = 0, limit: number = 20): Promise<ServiceResponse<any>> {
    const { search, scheduledFor } = query;

    const now = new Date();

    const caseFilter = {
      scheduledFor: {
        ...(scheduledFor || {}),
        $lte: scheduledFor?.$lte && scheduledFor.$lte < now ? scheduledFor.$lte : now,
      },
      status: { $ne: CallScheduleStatus.COMPLETED },
    };

    let pipeline: any[] = [];

    if (search) {
      pipeline = joinSearchQuery({
        search,
        fields: ['note'],
        query,
        joins: [
          {
            from: 'cases',
            localField: 'caseId',
            foreignField: '_id',
            as: 'case',
            searchFields: ['product', 'description'],
          },
          {
            from: 'customers',
            localField: 'customerId',
            foreignField: '_id',
            as: 'customer',
            searchFields: ['name', 'phone', 'address'],
          },
        ],
      });
    } else {
      pipeline = [
        { $lookup: { from: 'cases', localField: 'caseId', foreignField: '_id', as: 'case' } },
        { $unwind: '$case' },
        { $lookup: { from: 'customers', localField: 'customerId', foreignField: '_id', as: 'customer' } },
        { $unwind: '$customer' },
      ];
    }

    if (search) pipeline.push({ $unwind: '$customer' });
    pipeline.push({ $match: { ...caseFilter, ...query } });

    const data = await this.call.aggregateAndCount(pipeline, {
      aggregate: { skip, limit },
    });

    return { data, message: 'calls successfully fetched' };
  }
}
