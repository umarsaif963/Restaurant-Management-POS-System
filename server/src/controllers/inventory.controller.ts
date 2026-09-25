import type { Request, Response } from 'express';
import type {
  CreateInventoryItemInput,
  ListInventoryItemsQuery,
  ListInventoryTransactionsQuery,
  RecordInventoryTransactionInput,
  ReorderSuggestionsQuery,
  UpdateInventoryItemInput,
} from '@restaurant/shared';
import * as inventoryService from '../services/inventory.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function currentUserId(req: Request): string {
  return req.authenticated!.userId;
}

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListInventoryItemsQuery;
  const result = await inventoryService.listItems(query);
  res.status(200).json({ success: true, data: result });
});

export const getItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const item = await inventoryService.getItem(id);
  res.status(200).json({ success: true, data: { item } });
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateInventoryItemInput;
  const item = await inventoryService.createItem(body);
  res.status(201).json({ success: true, data: { item } });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateInventoryItemInput;
  const item = await inventoryService.updateItem(id, body);
  res.status(200).json({ success: true, data: { item } });
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await inventoryService.deleteItem(id);
  res.status(200).json({ success: true, data: null });
});

export const getReorderSuggestions = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ReorderSuggestionsQuery;
  const result = await inventoryService.getReorderSuggestions(query);
  res.status(200).json({ success: true, data: result });
});

export const listTransactions = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListInventoryTransactionsQuery;
  const result = await inventoryService.listTransactions(query);
  res.status(200).json({ success: true, data: result });
});

export const recordTransaction = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as RecordInventoryTransactionInput;
  const transaction = await inventoryService.recordTransaction(id, body, currentUserId(req));
  res.status(201).json({ success: true, data: { transaction } });
});