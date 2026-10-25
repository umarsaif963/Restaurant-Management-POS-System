import type { RequestHandler } from 'express';
import { COOKIE_NAMES } from '../config/auth.js';
import { prisma } from '../config/prisma.js';
import { runWithScope } from '../config/tenant-context.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { resolveUserPermissions } from '../services/permission.service.js';

/**
 * Verifies the `access_token` cookie, checks that the JWT-embedded session is
 * still live in the database (revocation + expiry enforced server-side) and
 * that the account is ACTIVE.
 *
 * On success `req.authenticated` is populated with the account's restaurant
 * membership and effective permissions, and the request is bound to that
 * restaurant so every downstream query is tenant-scoped.
 */
export function authenticate(): RequestHandler {
  return async (req, _res, next) => {
    try {
      const token = req.cookies?.[COOKIE_NAMES.ACCESS] as string | undefined;
      if (!token) {
        throw ApiError.unauthorized('Authentication required');
      }

      const payload = verifyAccessToken(token);

      const session = await prisma.session.findFirst({
        where: {
          id: payload.sessionId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
          user: { id: payload.userId, status: 'ACTIVE' },
        },
        select: {
          id: true,
          user: {
            select: {
              id: true,
              role: true,
              restaurantId: true,
              extraPermissions: true,
              restrictedPermissions: true,
              customRole: { select: { permissions: true } },
              restaurant: { select: { id: true, status: true } },
            },
          },
        },
      });

      if (!session) {
        throw ApiError.unauthorized('Session is no longer valid');
      }

      const user = session.user;

      // A suspended venue keeps its data but loses access to the workspace.
      if (user.restaurant && user.restaurant.status === 'SUSPENDED') {
        throw ApiError.forbidden('This restaurant account has been suspended. Contact support.');
      }

      const permissions = resolveUserPermissions({
        role: user.role,
        extraPermissions: user.extraPermissions,
        restrictedPermissions: user.restrictedPermissions,
        customRole: user.customRole ? { permissions: user.customRole.permissions } : null,
        customRolePermissions: user.customRole?.permissions ?? null,
      });

      req.authenticated = {
        userId: user.id,
        role: user.role,
        sessionId: session.id,
        restaurantId: user.restaurantId,
        permissions,
      };

      // Bind the rest of the request (including Prisma queries and interactive
      // transactions) to the account's restaurant. The platform operator has no
      // restaurant, so its scope stays unscoped until a platform route opts
      // into the platform-wide scope explicitly.
      const scope =
        user.role === 'SUPER_ADMIN'
          ? ({ kind: 'system' } as const)
          : ({ kind: 'tenant', restaurantId: user.restaurantId as string } as const);

      runWithScope(scope, () => next());
    } catch (error) {
      next(error);
    }
  };
}
