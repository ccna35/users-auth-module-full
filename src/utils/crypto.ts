import argon2 from 'argon2';
import crypto from 'crypto';

export async function hashPassword(plain: string) {
  return argon2.hash(plain, { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 });
}

export async function verifyPassword(hash: string, plain: string) {
  return argon2.verify(hash, plain);
}

export function randomToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('hex'); // 96 hex chars
}

export function sha256(input: string) {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}
