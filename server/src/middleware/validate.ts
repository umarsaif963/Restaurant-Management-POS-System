import type { RequestHandler } from 'express';
import type { ZodError, ZodTypeAny } from 'zod';
import { ApiError } from '../utils/ApiError.js';

export interface ValidateOptions {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Zod validation middleware. Each present shape is parsed and the result is
 * attached to the request (`validatedBody`/`validatedQuery`/`validatedParams`).
 * Failures short-circuit with a consistent 422 envelope.
 */
export function validate(schemas: ValidateOptions): RequestHandler {
  return (req, _res, next) => {
    try {
      if (schemas.body) {
        req.validatedBody = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.validatedQuery = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.validatedParams = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      next(ApiError.fromZodError(error as ZodError));
    }
  };
}