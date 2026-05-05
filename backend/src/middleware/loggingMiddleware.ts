import { Request, Response, NextFunction } from 'express';
import { log } from '../utils/logger';

export const loggingMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const { method, originalUrl } = req;

  // Log: Request Start
  log('backend', 'info', 'middleware', `Incoming ${method} ${originalUrl}`);

  // Hook into response finish to log Success/Error
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;

    if (statusCode >= 400) {
      log('backend', 'error', 'middleware', `${method} ${originalUrl} failed with ${statusCode} (${duration}ms)`);
    } else {
      log('backend', 'info', 'middleware', `${method} ${originalUrl} success ${statusCode} (${duration}ms)`);
    }
  });

  next();
};
