import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { Document, HydratedDocument, Types } from 'mongoose';

import { ILga } from '../type/state-local.interface';

export type LgaDocument = HydratedDocument<Lga>;

@Schema({ collection: 'lgas', versionKey: false, timestamps: true })
export class Lga extends Document implements ILga {
  @ApiProperty()
  @Prop({ type: String, required: true })
  name: string;

  @ApiProperty()
  @Prop({ type: Types.ObjectId, ref: 'State' })
  stateId: ObjectId;
}

export const LgaSchema = SchemaFactory.createForClass(Lga);

LgaSchema.virtual('state', {
  ref: 'State',
  localField: 'stateId',
  foreignField: '_id',
  justOne: true,
});

LgaSchema.set('toJSON', { virtuals: true });
LgaSchema.set('toObject', { virtuals: true });
