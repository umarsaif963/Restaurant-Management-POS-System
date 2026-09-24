import type { Request, Response } from 'express';
import type { ListAuditLogsQuery, PurgeAuditLogsInput } from '@restaurant/shared';
import { listAuditLogs, purgeAuditLogs } from '../services/audit.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListAuditLogsQuery;
  const data = await listAuditLogs(query);
  res.status(200).json({ success: true, data });
});

export const purge = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as unknown as PurgeAuditLogsInput;
  const data = await purgeAuditLogs(body.olderThanDays);
  res.status(200).json({ success: true, data });
});