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
import { ApiError } from '../utils/ApiError.js';

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

  // Cancelling an order is a separate capability from editing it, so a user
  // who may change an order still cannot void one.
  if (body.status === 'CANCELLED') {
    const permissions = req.authenticated?.permissions ?? [];
    if (!permissions.includes('ORDERS_CANCEL')) {
      throw ApiError.forbidden('You do not have permission to cancel orders');
    }

    // Voiding a sale that has already been paid for gives the money back, so
    // it needs the refund capability on top of the cancel capability. The
    // order is read through the tenant-scoped service, so an id belonging to
    // another restaurant is reported as "not found" rather than leaking.
    const order = await orderService.getOrder(id);
    const paid = Number.parseFloat(order.totalPaid) > 0 || order.paymentStatus === 'PAID';
    if (paid && !permissions.includes('ORDERS_REFUND')) {
      throw ApiError.forbidden('You do not have permission to refund a paid order');
    }
  }

  const order = await orderService.updateStatus(id, body, currentUserId(req));
  res.status(200).json({ success: true, data: { order } });
});