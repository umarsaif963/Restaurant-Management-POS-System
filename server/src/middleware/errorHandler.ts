import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

interface BodyParserErrorLike {
  type?: string;
}

/**
 * Central error handler. Never exposes stack traces or internal details to clients.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const bodyParserErr = err as BodyParserErrorLike;
  if (bodyParserErr.type === 'entity.parse.failed') {
    res.status(400).json({ success: false, message: 'Invalid JSON payload' });
    return;
  }

  if (err instanceof ApiError) {
    const body: { success: boolean; message: string; errors?: unknown[] } = {
      success: false,
      message: err.message,
    };
    if (err.errors && err.errors.length > 0) {
      body.errors = err.errors;
    }
    res.status(err.statusCode).json(body);
    return;
  }

  if (err instanceof Error) {
    logger.error(`Unhandled error: ${err.message}`, {
      stack: err.stack,
    });
  } else {
    logger.error('Unhandled non-Error value thrown', err);
  }

  res.status(500).json({ success: false, message: 'Internal server error' });
}