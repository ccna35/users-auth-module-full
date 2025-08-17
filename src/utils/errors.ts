export class AppError extends Error {
  constructor(public status: number, message: string, public code?: string, public meta?: unknown) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const NotFound = (msg = 'Not found') => new AppError(404, msg);
export const BadRequest = (msg = 'Bad request') => new AppError(400, msg);
export const Unauthorized = (msg = 'Unauthorized') => new AppError(401, msg);
export const Forbidden = (msg = 'Forbidden') => new AppError(403, msg);

export function errorMiddleware(err: unknown, _req: any, res: any, _next: any) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code, meta: err.meta });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal Server Error' });
}
