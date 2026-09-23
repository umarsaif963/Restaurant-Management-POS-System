import type { Request, Response } from 'express';
import type {
  ChangePurchaseStatusInput,
  CreatePurchaseInput,
  ListPurchasesQuery,
  UpdatePurchaseInput,
} from '@restaurant/shared';
import * as purchaseService from '../services/purchase.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function currentUserId(req: Request): string {
  return req.authenticated!.userId;
}

export const listPurchases = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListPurchasesQuery;
  const data = await purchaseService.listPurchases(query);
  res.status(200).json({ success: true, data });
});

export const getPurchase = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const purchase = await purchaseService.getPurchase(id);
  res.status(200).json({ success: true, data: { purchase } });
});

export const createPurchase = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreatePurchaseInput;
  const purchase = await purchaseService.createPurchase(body);
  res.status(201).json({ success: true, data: { purchase } });
});

export const updatePurchase = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdatePurchaseInput;
  const purchase = await purchaseService.updatePurchase(id, body);
  res.status(200).json({ success: true, data: { purchase } });
});

export const deletePurchase = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await purchaseService.deletePurchase(id);
  res.status(200).json({ success: true, data: null });
});

export const changePurchaseStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as ChangePurchaseStatusInput;
  const purchase = await purchaseService.changePurchaseStatus(id, body, currentUserId(req));
  res.status(200).json({ success: true, data: { purchase } });
});