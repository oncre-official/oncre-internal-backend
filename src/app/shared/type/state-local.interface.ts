import { ObjectId } from 'mongodb';

import { IBaseType } from '@on/utils/types';

export interface IState extends IBaseType {
  name: string;
  alias: string;
}

export interface ILga extends IBaseType {
  name: string;
  stateId: ObjectId;
}

export interface IStateLga {
  state: string;
  alias: string;
  lgas: string[];
}
