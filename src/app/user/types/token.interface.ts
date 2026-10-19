import { ObjectId } from 'mongodb';

import { TokenType } from '@on/enum';
import { IBaseType } from '@on/utils/types';

export interface IToken extends IBaseType {
  userId: ObjectId;
  type: TokenType;
  token: string;
  expiresAt: Date;
}
