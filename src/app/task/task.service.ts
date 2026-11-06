import { Injectable } from '@nestjs/common';

import { joinSearchQuery } from '@on/helpers/search';
import { ServiceResponse } from '@on/utils/types';

import { QueryTaskDto } from './dto/query.dto';
import { TaskRepository } from './repository/task.repository';
import { StaffTaskStatus } from './types/index.interface';

@Injectable()
export class TaskService {
  constructor(private readonly task: TaskRepository) {}

  async find(query: QueryTaskDto, skip: number = 0, limit: number = 20): Promise<ServiceResponse<any>> {
    const { search } = query;

    const joinQuery = joinSearchQuery({
      search,
      fields: [],
      query,
      joins: [],
    });

    const strategies = {
      search: () => this.task.aggregateAndCount(joinQuery, { aggregate: { skip, limit } }),
      normal: () =>
        this.task.findAndCount(query, {
          aggregate: { skip, limit },
          populate: [{ path: 'case' }],
          sort: { createdAt: -1 },
        }),
    };

    const data = search ? await strategies.search() : await strategies.normal();

    return { data, message: 'tasks successfully fetched' };
  }

  async queue(query: QueryTaskDto, skip: number = 0, limit: number = 20): Promise<ServiceResponse<any>> {
    const { search } = query;

    const now = new Date();

    const caseFilter = {
      scheduledFor: { $lte: now },
      status: { $ne: StaffTaskStatus.COMPLETED },
    };

    let pipeline: any[] = [];

    if (search) {
      pipeline = joinSearchQuery({
        search,
        fields: [],
        query,
        joins: [{ from: 'cases', localField: 'caseId', foreignField: '_id', as: 'case' }],
      });
    } else {
      pipeline = [
        { $lookup: { from: 'cases', localField: 'caseId', foreignField: '_id', as: 'case' } },
        { $unwind: '$case' },
      ];
    }

    pipeline.push({ $match: caseFilter });

    const data = await this.task.aggregateAndCount(pipeline, {
      populate: [{ path: 'customer' }],
      aggregate: { skip, limit },
    });

    return { data, message: 'tasks successfully fetched' };
  }
}
