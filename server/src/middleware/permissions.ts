import type { RequestHandler } from 'express';
import type { Permission } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { runWithScope } from '../config/tenant-context.js';

/**
 * Restricts a route to accounts that hold every listed permission.
 *
 * This is the fine-grained counterpart of `authorize(...roles)`: roles describe
 * the job function, permissions describe what the account may actually do.
 * The check runs on the server, so hiding a button in the UI is never the
 * only thing standing between a cashier and the owner-only screens.
 */
export function requirePermission(...required: Permission[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.authenticated) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }

    const granted = req.authenticated.permissions ?? [];
    const missing = required.filter((permission) => !granted.includes(permission));

    if (missing.length > 0) {
      next(
        ApiError.forbidden('You do not have permission to perform this action'),
      );
      return;
    }

    next();
  };
}

/**
 * Restricts a route to the platform operator. The scope behind this guard is
 * platform-wide, so the tenant filter is intentionally not applied.
 */
export function requirePlatformAdmin(): RequestHandler {
  return (req, _res, next) => {
    if (!req.authenticated) {
      next(ApiError.unauthorized('Authentication required'));
      return;
    }
    if (req.authenticated.role !== 'SUPER_ADMIN') {
      next(ApiError.forbidden('Platform administration requires an operator account'));
      return;
    }
    next();
  };
}

/**
 * Switches the request into the platform-wide scope, where queries are not
 * filtered by a restaurant. Only platform routes may use this, and they must
 * be guarded by `requirePlatformAdmin`.
 */
export function platformScope(): RequestHandler {
  return (_req, _res, next) => {
    runWithScope({ kind: 'platform' }, () => next());
  };
}
