import { Router } from 'express';
import type { HealthResponse } from '@restaurant/shared';
import { env } from '../config/env.js';

const router = Router();
const SERVICE_NAME = 'restaurant-management-server';
const SERVICE_VERSION = '1.0.0';

router.get('/', (_req, res) => {
  const data: HealthResponse = {
    status: 'ok',
    service: SERVICE_NAME,
    version: SERVICE_VERSION,
    environment: env.NODE_ENV,
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    database: env.DATABASE_URL ? 'configured' : 'not-configured',
  };
  res.status(200).json({ success: true, data });
});

export default router;