import { AnyZodObject } from 'zod';
import { RequestHandler } from 'express';

export function validate(schema: AnyZodObject, where: 'body' | 'query' | 'params' = 'body'): RequestHandler {
  return (req, _res, next) => {
    try {
      // trim strings shallowly
      if (where === 'body' && typeof req.body === 'object' && req.body) {
        for (const k of Object.keys(req.body)) {
          if (typeof req.body[k] === 'string') req.body[k] = req.body[k].trim();
        }
      }
      (req as any)[where] = (schema as any).parse((req as any)[where]);
      next();
    } catch (err) {
      next(err);
    }
  };
}
