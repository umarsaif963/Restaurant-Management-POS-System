import type { Server } from 'socket.io';
import { COOKIE_NAMES } from '../config/auth.js';
import { prisma } from '../config/prisma.js';
import { logger } from '../utils/logger.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { bridgeToSocket, restaurantRoom } from './realtime.js';

export interface SocketAuth {
  userId: string;
  role: string;
  sessionId: string;
  restaurantId: string | null;
}

function parseCookies(header: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!header) {
    return cookies;
  }
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key) {
      cookies[key] = value;
    }
  }
  return cookies;
}

/**
 * Authenticates every socket handshake using the same access token as the
 * HTTP API: either the `access_token` cookie (browser, same-origin via the
 * Vite proxy) or a token passed in the handshake `auth` payload (API/CLI
 * clients). Rejects handshakes whose JWT, session revocation or account
 * status are invalid.
 */
export function initSocket(io: Server): Server {
  io.use(async (socket, next) => {
    try {
      const authToken =
        (socket.handshake.auth?.token as string | undefined) ??
        parseCookies(socket.handshake.headers.cookie)[COOKIE_NAMES.ACCESS];

      if (!authToken) {
        throw new Error('Authentication required');
      }

      const payload = verifyAccessToken(authToken);

      const session = await prisma.session.findFirst({
        where: {
          id: payload.sessionId,
          revokedAt: null,
          expiresAt: { gt: new Date() },
          user: { id: payload.userId, status: 'ACTIVE' },
        },
        select: {
          id: true,
          user: { select: { id: true, role: true, restaurantId: true } },
        },
      });

      if (!session) {
        throw new Error('Session is no longer valid');
      }

      socket.data.auth = {
        userId: session.user.id,
        role: session.user.role,
        sessionId: session.id,
        restaurantId: session.user.restaurantId,
      } satisfies SocketAuth;
      next();
    } catch (error) {
      const reason = error instanceof Error ? error.message : 'Unauthorized';
      logger.warn(`Socket handshake rejected: ${reason}`);
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const auth = socket.data.auth as SocketAuth | undefined;
    logger.info(`Socket connected: ${socket.id} (user ${auth?.userId ?? 'n/a'})`);

    // Every client only listens to its own restaurant's room, so events of one
    // venue never reach the screens of another venue.
    if (auth?.restaurantId) {
      void socket.join(restaurantRoom(auth.restaurantId));
    }

    socket.emit('server:info', {
      service: 'restaurant-management-server',
      timestamp: new Date().toISOString(),
    });

    socket.on('ping', (sentAt: number) => {
      socket.emit('pong', { sentAt, serverAt: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      logger.info(`Socket disconnected: ${socket.id} (${reason})`);
    });
  });

  bridgeToSocket(io);

  return io;
}