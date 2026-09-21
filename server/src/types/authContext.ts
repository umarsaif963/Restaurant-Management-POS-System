import type { UserRole } from '@prisma/client';

/**
 * Authenticated-user context attached to `req.authenticated` by the
 * `authenticate` middleware (module 3).
 */
export interface AuthContext {
  userId: string;
  role: UserRole;
  sessionId: string;
}