import { IBaseType } from '@on/utils/types';

export interface IPermission extends IBaseType {
  name: string;
  description?: string;
}
