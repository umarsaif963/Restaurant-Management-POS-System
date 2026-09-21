import type { Request, Response } from 'express';
import type { UpdateSettingsInput } from '@restaurant/shared';
import * as settingsService from '../services/settings.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const data = await settingsService.getSettings();
  res.status(200).json({ success: true, data });
});

export const updateSettings = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as UpdateSettingsInput;
  const data = await settingsService.updateSettings(body);
  res.status(200).json({ success: true, data });
});