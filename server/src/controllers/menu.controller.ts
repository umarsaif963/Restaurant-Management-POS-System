import type { Request, Response } from 'express';
import type {
  CreateAddOnInput,
  CreateMenuCategoryInput,
  CreateMenuItemInput,
  CreateVariationInput,
  ListMenuItemsQuery,
  UpdateAddOnInput,
  UpdateMenuCategoryInput,
  UpdateMenuItemInput,
  UpdateVariationInput,
} from '@restaurant/shared';
import * as menuService from '../services/menu.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// ---- Categories ----------------------------------------------

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await menuService.listCategories();
  res.status(200).json({ success: true, data: { categories } });
});

export const createCategory = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateMenuCategoryInput;
  const category = await menuService.createCategory(body);
  res.status(201).json({ success: true, data: { category } });
});

export const updateCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateMenuCategoryInput;
  const category = await menuService.updateCategory(id, body);
  res.status(200).json({ success: true, data: { category } });
});

export const deleteCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await menuService.deleteCategory(id);
  res.status(200).json({ success: true, message: 'Menu category deleted' });
});

// ---- Menu items ----------------------------------------------

export const listItems = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListMenuItemsQuery;
  const items = await menuService.listItems(query);
  res.status(200).json({ success: true, data: items });
});

export const createItem = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateMenuItemInput;
  const item = await menuService.createItem(body);
  res.status(201).json({ success: true, data: { item } });
});

export const updateItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateMenuItemInput;
  const item = await menuService.updateItem(id, body);
  res.status(200).json({ success: true, data: { item } });
});

export const deleteItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await menuService.deleteItem(id);
  res.status(200).json({ success: true, message: 'Menu item deleted' });
});

// ---- Variations ----------------------------------------------

export const createVariation = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.validatedParams as { itemId: string };
  const body = req.validatedBody as CreateVariationInput;
  const variation = await menuService.createVariation(itemId, body);
  res.status(201).json({ success: true, data: { variation } });
});

export const updateVariation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateVariationInput;
  const variation = await menuService.updateVariation(id, body);
  res.status(200).json({ success: true, data: { variation } });
});

export const deleteVariation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await menuService.deleteVariation(id);
  res.status(200).json({ success: true, message: 'Variation deleted' });
});

// ---- Add-ons ------------------------------------------------

export const createAddOn = asyncHandler(async (req: Request, res: Response) => {
  const { itemId } = req.validatedParams as { itemId: string };
  const body = req.validatedBody as CreateAddOnInput;
  const addOn = await menuService.createAddOn(itemId, body);
  res.status(201).json({ success: true, data: { addOn } });
});

export const updateAddOn = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateAddOnInput;
  const addOn = await menuService.updateAddOn(id, body);
  res.status(200).json({ success: true, data: { addOn } });
});

export const deleteAddOn = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await menuService.deleteAddOn(id);
  res.status(200).json({ success: true, message: 'Add-on deleted' });
});