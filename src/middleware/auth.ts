import { RequestHandler } from 'express';
import { Unauthorized, Forbidden } from '../utils/errors';
import { verifyAccessToken } from '../utils/jwt';

export const requireAuth: RequestHandler = (req, _res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) throw Unauthorized('Missing Authorization header');
  const token = auth.slice('Bearer '.length);
  try {
    const payload = verifyAccessToken(token);
    req.user = { sub: payload.sub, role: payload.role, iat: payload.iat, exp: payload.exp };
    next();
  } catch {
    throw Unauthorized('Invalid or expired token');
  }
};

export function requireRole(...roles: Array<'USER' | 'ADMIN'>): RequestHandler {
  return (req, _res, next) => {
    if (!req.user) throw Unauthorized();
    if (!roles.includes(req.user.role)) throw Forbidden('Insufficient role');
    next();
  };
}
