import * as crypto from 'crypto';

import * as bcrypt from 'bcrypt';
import * as randomstring from 'randomstring';

import { config } from '@on/config';

export const hashResource = async (password: string) => {
  const saltOrRounds = Number(config.jwt.saltOrRounds);
  return await bcrypt.hash(password, saltOrRounds);
};

export const compareResource = async (password: string, hashedResource: string) => {
  return await bcrypt.compare(password, hashedResource);
};

export const generatePassword = async () => {
  const password = randomstring.generate(7);
  const hashedPassword = await hashResource(password);

  return [password, hashedPassword];
};

export const createHash = (value: string) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};
