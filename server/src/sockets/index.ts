import type { Server } from 'socket.io';
import { logger } from '../utils/logger.js';

/**
 * Initializes the Socket.IO server wiring.
 *
 * Module 1 provides the real-time transport and a ping/pong latency probe.
 * Future modules (Kitchen Display System, order status broadcasts, table
 * status updates) attach their own listeners and emitters here.
 */
export function initSocket(io: Server): Server {
  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

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

  return io;
}