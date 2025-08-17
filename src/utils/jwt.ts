import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export function signAccessToken(payload: object) {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: 'USER' | 'ADMIN'; iat: number; exp: number };
}
