import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const serverRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

/**
 * The Prisma CLI lives in the hoisted root `node_modules`, not in the
 * workspace folder, so the binary is looked up in both places.
 */
function resolvePrismaCli(): string {
  const candidates = [
    path.join(serverRoot, 'node_modules', '.bin', 'prisma.cmd'),
    path.join(serverRoot, '..', 'node_modules', '.bin', 'prisma.cmd'),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`Prisma CLI not found. Looked in:\n${candidates.join('\n')}`);
  }
  return found;
}

const databaseUrl =
  process.env.TEST_DATABASE_URL ??
  'postgresql://postgres:admin@localhost:5432/restaurant_db_test?schema=public';

process.env.DATABASE_URL = databaseUrl;
process.env.NODE_ENV = 'test';

/**
 * Bring the test database up to date before the suite runs.
 *
 * The migrations are applied with `migrate deploy` so the test database is
 * built exactly the way a fresh production database would be - a wrong
 * migration order fails the suite instead of silently passing.
 */
export default function globalSetup(): void {
  const prismaCli = resolvePrismaCli();

  execFileSync('cmd.exe', ['/c', prismaCli, 'migrate', 'deploy'], {
    cwd: serverRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}
