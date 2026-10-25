/**
 * Test bootstrap.
 *
 * Runs before every test file. The database URL is pinned here as well, so a
 * worker that starts without the environment of the main process still points
 * at the test database and never at the development database.
 */
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:admin@localhost:5432/restaurant_db_test?schema=public';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-access-secret-value-0000';
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret-value-00000';

import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/config/prisma.js';
import { resetDatabase } from './helpers/db.js';

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  await prisma.$disconnect();
});
