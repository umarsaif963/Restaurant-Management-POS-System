import type { ZodError } from 'zod';

/**
 * Operational error that maps to a specific HTTP status code.
 * Throw from services/controllers and let the central error handler respond.
 */
export class ApiError extends Error {
  readonly statusCode: number;
  readonly errors?: unknown[];

  constructor(statusCode: number, message: string, errors?: unknown[]) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;
    Error.captureStackTrace?.(this, ApiError);
  }

  static badRequest(message = 'Bad request'): ApiError {
    return new ApiError(400, message);
  }

  static unauthorized(message = 'Unauthorized'): ApiError {
    return new ApiError(401, message);
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message);
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message);
  }

  static conflict(message = 'Conflict'): ApiError {
    return new ApiError(409, message);
  }

  static unprocessable(message = 'Validation failed', errors?: unknown[]): ApiError {
    return new ApiError(422, message, errors);
  }

  /**
   * Convert a Zod validation failure into a consistent 422 ApiError.
   */
  static fromZodError(error: ZodError): ApiError {
    return ApiError.unprocessable(
      'Validation failed',
      error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      })),
    );
  }
}