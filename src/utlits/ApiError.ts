// src/utils/ApiError.ts
// Typed error class — thrown inside services, caught by errorHandler middleware

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly data?: unknown;

  constructor(statusCode: number, code: string, message: string, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }

  // ── Common factory methods ────────────────────────────────
  static badRequest(message: string, data?: unknown) {
    return new ApiError(400, "BAD_REQUEST", message, data);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "Not found") {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(code: string, message: string, data?: unknown) {
    return new ApiError(409, code, message, data);
  }

  static internal(message = "Internal server error") {
    return new ApiError(500, "INTERNAL_SERVER_ERROR", message);
  }
}