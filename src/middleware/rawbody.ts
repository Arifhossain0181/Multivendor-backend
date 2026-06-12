// src/middlewares/rawBody.ts
// Stripe webhook signature verification requires the RAW request body.
// Express's json() parser replaces req.body with parsed JSON,
// so we capture the raw buffer BEFORE parsing and attach it to req.

import { Request, Response, NextFunction } from "express";

declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

export const rawBody = (req: Request, res: Response, next: NextFunction) => {
  let data = Buffer.alloc(0);

  req.on("data", (chunk: Buffer) => {
    data = Buffer.concat([data, chunk]);
  });

  req.on("end", () => {
    req.rawBody = data;
    next();
  });

  req.on("error", next);
};