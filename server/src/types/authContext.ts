import type { Permission, UserRole } from '@prisma/client';

/**
 * Authenticated-user context attached to `req.authenticated` by the
 * `authenticate` middleware.
 */
export interface AuthContext {
  userId: string;
  role: UserRole;
  sessionId: string;
  /**
   * The restaurant the session belongs to. `null` only for the platform super
   * admin, who operates across every restaurant.
   */
  restaurantId: string | null;
  /** Effective capability set, resolved from role + custom role + overrides. */
  permissions: Permission[];
}
