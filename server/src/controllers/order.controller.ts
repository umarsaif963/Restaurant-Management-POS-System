import type { Request, Response } from 'express';
import type {
  AddOrderItemsInput,
  CreateOrderInput,
  ListOrdersQuery,
  UpdateOrderInput,
  UpdateOrderStatusInput,
} from '@restaurant/shared';
import * as orderService from '../services/order.service.js';
import * as receiptService from '../services/receipt.service.js';
import * as inventoryService from '../services/inventory.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function currentUserId(req: Request): string {
  return req.authenticated!.userId;
}

export const listOrders = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListOrdersQuery;
  const orders = await orderService.listOrders(query);
  res.status(200).json({ success: true, data: orders });
});

export const getOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const order = await orderService.getOrder(id);
  res.status(200).json({ success: true, data: { order } });
});

export const getReceipt = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const receipt = await receiptService.buildReceipt(id);
  res.status(200).json({ success: true, data: { receipt } });
});

export const getInventoryMovements = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const result = await inventoryService.listOrderInventoryMovements(id);
  res.status(200).json({ success: true, data: result });
});

export const createOrder = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateOrderInput;
  const order = await orderService.createOrder(currentUserId(req), body);
  res.status(201).json({ success: true, data: { order } });
});

export const updateOrder = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateOrderInput;
  const order = await orderService.updateOrder(id, body);
  res.status(200).json({ success: true, data: { order } });
});

export const addItems = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as AddOrderItemsInput;
  const order = await orderService.addItems(id, body, currentUserId(req));
  res.status(200).json({ success: true, data: { order } });
});

export const removeItem = asyncHandler(async (req: Request, res: Response) => {
  const { id, itemId } = req.validatedParams as { id: string; itemId: string };
  const order = await orderService.removeItem(id, itemId, currentUserId(req));
  res.status(200).json({ success: true, data: { order } });
});

export const updateStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateOrderStatusInput;
  const order = await orderService.updateStatus(id, body, currentUserId(req));
  res.status(200).json({ success: true, data: { order } });
});