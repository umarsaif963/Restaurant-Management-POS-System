import { Router } from 'express';
import type { HealthResponse } from '@restaurant/shared';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';

const router = Router();
const SERVICE_NAME = 'restaurant-management-server';
const SERVICE_VERSION = '1.0.0';

router.get('/', async (_req, res) => {
  let database: HealthResponse['database'] = 'not-configured';

  if (env.DATABASE_URL) {
    database = 'configured';
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = 'connected';
    } catch {
      database = 'unreachable';
    }
  }

  const data: HealthResponse = {
    status: 'ok',
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    environment: env.NODE_ENV,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database,
  };
  res.status(200).json({ success: true, data });
});

export default router;