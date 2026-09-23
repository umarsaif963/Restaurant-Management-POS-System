import type { Request, Response } from 'express';
import type {
  CreateSupplierInput,
  ListSuppliersQuery,
  UpdateSupplierInput,
} from '@restaurant/shared';
import * as supplierService from '../services/supplier.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listSuppliers = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListSuppliersQuery;
  const data = await supplierService.listSuppliers(query);
  res.status(200).json({ success: true, data });
});

export const getSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const supplier = await supplierService.getSupplier(id);
  res.status(200).json({ success: true, data: { supplier } });
});

export const createSupplier = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateSupplierInput;
  const supplier = await supplierService.createSupplier(body);
  res.status(201).json({ success: true, data: { supplier } });
});

export const updateSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateSupplierInput;
  const supplier = await supplierService.updateSupplier(id, body);
  res.status(200).json({ success: true, data: { supplier } });
});

export const deleteSupplier = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await supplierService.deleteSupplier(id);
  res.status(200).json({ success: true, data: null });
});