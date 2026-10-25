import type { Request } from 'express';
import type { UserRole } from '@prisma/client';
import { ApiError } from './ApiError.js';

/**
 * The authenticated caller, reduced to what the services need.
 */
export interface Actor {
  userId: string;
  role: UserRole;
  restaurantId: string | null;
  permissions: readonly string[];
}

/**
 * Extract the authenticated caller from the request.
 */
export function actorFrom(req: Request): Actor {
  const auth = req.authenticated;
  if (!auth) {
    throw ApiError.unauthorized('Authentication required');
  }
  return {
    userId: auth.userId,
    role: auth.role,
    restaurantId: auth.restaurantId,
    permissions: auth.permissions ?? [],
  };
}
