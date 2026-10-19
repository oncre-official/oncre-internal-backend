import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { HydratedDocument } from 'mongoose';

import { ICounter } from '../type/counter.interface';

export type CounterDocument = HydratedDocument<Counter>;

@Schema({ collection: 'counters', versionKey: false, timestamps: true, _id: false })
export class Counter implements ICounter {
  @ApiProperty()
  @Prop({ type: String, required: true })
  declare _id: string;

  @ApiProperty()
  @Prop({ type: Number, required: true })
  seq: number;
}

export const CounterSchema = SchemaFactory.createForClass(Counter);
