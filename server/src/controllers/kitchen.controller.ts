import type { Request, Response } from 'express';
import type { ListKitchenOrdersQuery, UpdateKitchenOrderStatusInput } from '@restaurant/shared';
import * as kitchenService from '../services/kitchen.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function currentUserId(req: Request): string {
  return req.authenticated!.userId;
}

export const listKitchenOrders = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListKitchenOrdersQuery;
  const tickets = await kitchenService.listKitchenOrders(query);
  res.status(200).json({ success: true, data: tickets });
});

export const getKitchenOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const ticket = await kitchenService.getKitchenOrder(id);
  res.status(200).json({ success: true, data: { ticket } });
});

export const updateKitchenStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateKitchenOrderStatusInput;
  const ticket = await kitchenService.updateKitchenOrderStatus(id, currentUserId(req), body.status);
  res.status(200).json({ success: true, data: { ticket } });
});