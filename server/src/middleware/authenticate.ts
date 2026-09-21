import type { RequestHandler } from 'express';
import { COOKIE_NAMES } from '../config/auth.js';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';

/**
 * Verifies the `access_token` cookie, checks that the JWT-embedded session is
 * still live in the database (revocation + expiry enforced server-side) and
 * that the account is ACTIVE. On success `req.authenticated` is populated.
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
          user: { select: { id: true, role: true } },
        },
      });

      if (!session) {
        throw ApiError.unauthorized('Session is no longer valid');
      }

      req.authenticated = {
        userId: session.user.id,
        role: session.user.role,
        sessionId: session.id,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}