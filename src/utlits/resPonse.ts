// src/utils/response.ts
// asyncHandler — wraps async route handlers so errors go to next()
// sendSuccess / sendError — consistent JSON response shape

import { Request, Response, NextFunction, RequestHandler } from "express";
import { ApiError } from "./ApiError";

// ── asyncHandler ──────────────────────────────────────────────
type AsyncFn = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export const asyncHandler =
  (fn: AsyncFn): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// ── Success response ──────────────────────────────────────────
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  message = "Success"
) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

// ── Error response (used by errorHandler) ─────────────────────
export const sendError = (
  res: Response,
  err: ApiError | Error,
  statusCode = 500
) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      ...(err.data !== undefined && { data: err.data }),
    });
  }

  return res.status(statusCode).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: "Something went wrong",
  });
};