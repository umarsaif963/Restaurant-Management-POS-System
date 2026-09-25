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

/**
 * Budget for interactive `prisma.$transaction(async (tx) => ...)` calls.
 *
 * Prisma's default `timeout` is 5s, which is shorter than one cold round-trip
 * to a scale-to-zero database (Neon suspends its compute when idle, so the
 * first query after a pause can take 8-20s). When the budget expires Prisma
 * closes the transaction, and the next `tx.*` call in the callback throws
 * P2028 "Transaction already closed" / "Transaction not found" — the write
 * that was already in flight is rolled back with it.
 *
 * `maxWait` covers waiting for a free pool connection, which is likewise
 * unbounded while the pool refills after a cold start.
 *
 * Pass this to every interactive transaction that performs more than a single
 * write, so one slow round-trip cannot tear a multi-step write apart.
 */
export const TRANSACTION_OPTIONS = { maxWait: 30_000, timeout: 60_000 } as const;