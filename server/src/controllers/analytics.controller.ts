import type { Request, Response } from 'express';
import type { AnalyticsRangeQuery, TopItemsQuery } from '@restaurant/shared';
import {
  getDashboardSummary,
  getOrderBreakdown,
  getPaymentMethods,
  getSalesByDay,
  getTopItems,
} from '../services/analytics.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const dashboardSummary = asyncHandler(async (_req: Request, res: Response) => {
  const data = await getDashboardSummary();
  res.status(200).json({ success: true, data });
});

export const salesByDay = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as AnalyticsRangeQuery;
  const data = await getSalesByDay(query);
  res.status(200).json({ success: true, data });
});

export const topItems = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as TopItemsQuery;
  const data = await getTopItems(query);
  res.status(200).json({ success: true, data });
});

export const paymentMethods = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as AnalyticsRangeQuery;
  const data = await getPaymentMethods(query);
  res.status(200).json({ success: true, data });
});

export const orderBreakdown = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as AnalyticsRangeQuery;
  const data = await getOrderBreakdown(query);
  res.status(200).json({ success: true, data });
});