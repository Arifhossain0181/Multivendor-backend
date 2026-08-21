import { Request, Response, NextFunction } from 'express';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export const rateLimit = (windowMs: number, max: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const record = rateLimitMap.get(key);

    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count += 1;

    if (record.count > max) {
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
      });
    }

    next();
  };
};
