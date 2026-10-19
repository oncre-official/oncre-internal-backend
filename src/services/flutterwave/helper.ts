import * as crypto from 'crypto';

import { config } from '@on/config';

export function encrypt3DES2(payload: Record<string, any>): string {
  const encryptionKey = config.flutterwave.encryptionKey;

  if (!encryptionKey) throw new Error('FLUTTERWAVE_ENCRYPTION_KEY is not configured');

  const key = Buffer.from(encryptionKey, 'utf8');

  if (key.length !== 24) {
    throw new Error(`Flutterwave encryption key must be 24 bytes for 3DES-24. Received ${key.length} bytes.`);
  }

  const cipher = crypto.createCipheriv('des-ede3', key, null);

  cipher.setAutoPadding(true);

  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);

  return encrypted.toString('base64');
}

export function encrypt3DES(payload: any) {
  const encryptionKey = config.flutterwave.encryptionKey;

  const text = JSON.stringify(payload);
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const forge = require('node-forge');
  const cipher = forge.cipher.createCipher('3DES-ECB', forge.util.createBuffer(encryptionKey));

  cipher.start({ iv: '' });
  cipher.update(forge.util.createBuffer(text, 'utf-8'));
  cipher.finish();

  const encrypted = cipher.output;

  return forge.util.encode64(encrypted.getBytes());
}
