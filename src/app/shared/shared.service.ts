import { Injectable } from '@nestjs/common';

import { CloudinaryService } from '@on/services/cloudinary/service';
import { FileDto } from '@on/utils/dto/file.dto';
import { ServiceResponse } from '@on/utils/types';

import { LgaQueryDto, StateQueryDto } from './dto/state-local.dto';
import { Lga } from './model/local-govt.model';
import { State } from './model/state.model';
import { CounterRepository } from './repository/counter.repository';
import { LgaRepository } from './repository/local-govt.repository';
import { StateRepository } from './repository/state.repository';

@Injectable()
export class SharedService {
  constructor(
    private readonly lga: LgaRepository,
    private readonly state: StateRepository,
    private readonly counter: CounterRepository,
    private readonly cloudinary: CloudinaryService,
  ) {}

  async findState(query: StateQueryDto): Promise<ServiceResponse<State[]>> {
    const data = await this.state.find(query, { sort: { name: 1 } });

    return { data, message: `State successfully fetched` };
  }

  async findLga(query: LgaQueryDto): Promise<ServiceResponse<Lga[]>> {
    const data = await this.lga.find(query, {
      populate: [{ path: 'state', select: ['name', 'alias'] }],
      sort: { name: 1 },
    });

    return { data, message: `Lga successfully fetched` };
  }

  async uploadFile(payload: FileDto): Promise<ServiceResponse<string | null>> {
    const { file } = payload;

    const url = file ? await this.cloudinary.uploadImage(file) : null;

    return { data: url, message: `Lga successfully fetched` };
  }

  /**
   * UTILITIES
   */

  async generateSequentialId(counterName: string, prefix: string, padding: number = 5): Promise<string> {
    const result = await this.counter.findOneAndUpdate(
      { _id: counterName },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: 'after' },
    );

    const seq = result?.seq || 1;

    return `${prefix}-${String(seq).padStart(padding, '0')}`;
  }
}
