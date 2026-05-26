// src/middlewares/errorHandler.ts
// Global error handler — must be the LAST middleware in app.ts
// Catches everything thrown by asyncHandler or next(err)

import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { sendError } from "../utils/response";
import { env } from "../config/env";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Log full error in dev, minimal in production
  if (env.NODE_ENV === "development") {
    console.error("🔴 Error:", err);
  } else {
    console.error(`[${new Date().toISOString()}] ${err.message}`);
  }

  // Prisma known request error (e.g. unique constraint violation)
  if (err.constructor.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as unknown as { code: string; meta?: { target?: string[] } };

    if (prismaErr.code === "P2002") {
      return sendError(
        res,
        new ApiError(409, "DUPLICATE_ENTRY", `Duplicate entry: ${prismaErr.meta?.target?.join(", ")}`),
      );
    }

    if (prismaErr.code === "P2025") {
      return sendError(res, ApiError.notFound("Record not found"));
    }
  }

  // Prisma validation error
  if (err.constructor.name === "PrismaClientValidationError") {
    return sendError(res, ApiError.badRequest("Invalid data provided"));
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return sendError(res, ApiError.unauthorized("Invalid token"));
  }
  if (err.name === "TokenExpiredError") {
    return sendError(res, ApiError.unauthorized("Token expired"));
  }

  // Our own ApiError
  if (err instanceof ApiError) {
    return sendError(res, err);
  }

  // Unknown — 500
  return sendError(res, err);
};