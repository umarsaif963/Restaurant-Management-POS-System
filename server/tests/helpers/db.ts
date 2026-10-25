import { prisma } from '../../src/config/prisma.js';

/**
 * Empties every application table.
 *
 * `TRUNCATE ... CASCADE` handles the foreign-key order on its own, so new
 * tables are picked up automatically instead of breaking the test suite with
 * an outdated hand-written delete order.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    DO $$
    DECLARE
      table_name text;
    BEGIN
      FOR table_name IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = current_schema()
          AND tablename <> '_prisma_migrations'
      LOOP
        EXECUTE format('TRUNCATE TABLE %I RESTART IDENTITY CASCADE', table_name);
      END LOOP;
    END $$;
  `);
}
