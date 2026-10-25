import { defineConfig } from 'vitest/config';

/**
 * The test suite runs against a dedicated database so it can never touch
 * development or production data. The URL is resolved before anything imports
 * the server configuration, because `src/config/env.ts` freezes the value at
 * import time.
 */
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:admin@localhost:5432/restaurant_db_test?schema=public';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = TEST_DATABASE_URL;

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    globalSetup: ['./tests/globalSetup.ts'],
    fileParallelism: false,
    sequence: { concurrent: false },
    hookTimeout: 60_000,
    testTimeout: 30_000,
    teardownTimeout: 30_000,
  },
});
