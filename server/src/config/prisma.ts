import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Reuse the same PrismaClient across hot-reloads in development to avoid
 * exhausting database connections.
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: env.DATABASE_URL ? { db: { url: env.DATABASE_URL } } : undefined,
  });
}

export const prisma = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}