import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument } from 'mongoose';

import { IState } from '../type/state-local.interface';

export type StateDocument = HydratedDocument<State>;

@Schema({ collection: 'states', versionKey: false, timestamps: true })
export class State extends Document implements IState {
  @ApiProperty()
  @Prop({ type: String, required: true })
  name: string;

  @ApiProperty()
  @Prop({ type: String, required: true })
  alias: string;
}

export const StateSchema = SchemaFactory.createForClass(State);
