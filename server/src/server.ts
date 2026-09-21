import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { app } from './app.js';
import { env } from './config/env.js';
import { initSocket } from './sockets/index.js';
import { logger } from './utils/logger.js';

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URL,
    credentials: true,
  },
});

initSocket(io);

httpServer.listen(env.PORT, () => {
  logger.info(`Server URL: ${env.SERVER_URL}`);
  logger.info(`Socket.IO server ready`);
});

function shutdown(signal: string): void {
  logger.info(`${signal} received, shutting down gracefully...`);
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));