import { Injectable } from '@nestjs/common';

import { joinSearchQuery } from '@on/helpers/search';
import { ServiceResponse } from '@on/utils/types';

import { QueryMessageDto } from './dto/query.dto';
import { MessageRepository } from './repository/message.repository';

@Injectable()
export class MessageService {
  constructor(private readonly message: MessageRepository) {}

  async find(query: QueryMessageDto, skip: number = 0, limit: number = 20): Promise<ServiceResponse<any>> {
    const { search } = query;

    const joinQuery = joinSearchQuery({
      search,
      fields: [],
      query,
      joins: [
        {
          from: 'customers',
          localField: 'customerId',
          foreignField: '_id',
          as: 'customer',
          searchFields: ['name', 'phone'],
        },
      ],
    });

    const strategies = {
      search: () => this.message.aggregateAndCount(joinQuery, { aggregate: { skip, limit } }),
      normal: () =>
        this.message.findAndCount(query, {
          aggregate: { skip, limit },
          populate: [{ path: 'case' }, { path: 'customer' }],
          sort: { created_at: -1 },
        }),
    };

    const data = search ? await strategies.search() : await strategies.normal();

    return { data, message: 'messages successfully fetched' };
  }
}
