import type { Request, RequestHandler } from 'express';
import { prisma } from '../config/prisma.js';
import type { AuthContext } from '../types/authContext.js';
import { logger } from '../utils/logger.js';

/**
 * Request audit capture (module 14).
 *
 * Records one row per `/api/v1` request once the response finishes (so the
 * final status code is known, including 4xx/5xx). Bodies are never persisted —
 * only method, path, status, duration, user-agent and IP. Unauthenticated
 * requests (and failed logins) still get rows with a null actor, which is
 * exactly what a security review wants to see.
 */
const SKIP_PATHS = [/^\/api\/v1\/health$/, /^\/api\/v1\/socket\.io($|\/)/];

const USER_AGENT_MAX_LENGTH = 200;

export function auditLogger(): RequestHandler {
  return (req, res, next) => {
    const startedAt = Date.now();
    res.on('finish', () => {
      const path = `${req.baseUrl}${req.path}`;
      if (SKIP_PATHS.some((pattern) => pattern.test(path))) return;
      const authenticated = (req as Request & { authenticated?: AuthContext }).authenticated;

      void prisma.auditLog
        .create({
          data: {
            userId: authenticated?.userId ?? null,
            action: `${req.method} ${path}`,
            entity: 'HTTP',
            ip: req.ip ?? null,
            metadata: {
              method: req.method,
              path,
              status: res.statusCode,
              durationMs: Date.now() - startedAt,
              userAgent: (req.get('user-agent') ?? '').slice(0, USER_AGENT_MAX_LENGTH),
            },
          },
        })
        .catch((error) => logger.error('Failed to write audit log', error));
    });
    next();
  };
}