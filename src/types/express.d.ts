import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      sub: string; // user id
      role: 'USER' | 'ADMIN';
      iat?: number;
      exp?: number;
    };
  }
}
