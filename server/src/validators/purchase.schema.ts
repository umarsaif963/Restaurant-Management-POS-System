import { z } from 'zod';
import { PurchaseStatus } from '@prisma/client';
import { idSchema, resourceIdParamsSchema } from './common.js';

export const purchaseParamsSchema = resourceIdParamsSchema;

const DECIMAL = /^\d{1,9}(\.\d{1,3})?$/;
const MONEY = /^\d{1,9}(\.\d{1,2})?$/;

const quantitySchema = z
  .string()
  .trim()
  .regex(DECIMAL, 'Enter a valid quantity')
  .refine((value) => Number(value) > 0, 'Quantity must be greater than zero');

const unitCostSchema = z
  .string()
  .trim()
  .regex(MONEY, 'Enter a valid unit cost')
  .refine((value) => Number(value) >= 0, 'Unit cost must not be negative');

const purchaseItemSchema = z.object({
  inventoryItemId: idSchema,
  quantity: quantitySchema,
  unitCost: unitCostSchema,
});

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

export const createPurchaseSchema = z.object({
  supplierId: idSchema,
  notes: optionalText(400, 'Notes must be at most 400 characters'),
  items: z.array(purchaseItemSchema).min(1, 'Add at least one item').max(100, 'Too many items'),
});

export const updatePurchaseSchema = z
  .object({
    notes: optionalText(400, 'Notes must be at most 400 characters'),
    items: z.array(purchaseItemSchema).min(1, 'Add at least one item').max(100, 'Too many items').optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const changePurchaseStatusSchema = z.object({
  status: z.enum([PurchaseStatus.RECEIVED, PurchaseStatus.CANCELLED]),
});

export const listPurchasesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  status: z.nativeEnum(PurchaseStatus).optional(),
});