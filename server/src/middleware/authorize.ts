import type { RequestHandler } from 'express';
import type { UserRole } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';

/**
 * Restrict a route to one or more roles. Must be mounted after
 * `authenticate()`.
 */
export function authorize(...roles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.authenticated) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }
    if (!roles.includes(req.authenticated.role)) {
      next(ApiError.forbidden('You do not have permission to perform this action'));
      return;
    }
    next();
  };
}