import { z } from 'zod';
import { InventoryTransactionType, StockUnit } from '@prisma/client';
import { idSchema } from './common.js';

export const resourceIdParamsSchema = z.object({ id: idSchema });

const decimalUpTo = (message: string, allowZero = false) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,9}(\.\d{1,3})?$/, message)
    .refine((value) => allowZero || Number(value) > 0, allowZero ? undefined : 'Value must be greater than zero');

const moneyUpTo = (message: string) =>
  z
    .string()
    .trim()
    .regex(/^\d{1,9}(\.\d{1,2})?$/, message)
    .refine((value) => Number(value) >= 0, 'Value must not be negative');

const optionalClearedText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

const optionalDateSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Enter a valid date')
  .nullable()
  .optional();

export const createInventoryItemSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be at most 120 characters'),
  sku: optionalClearedText(64, 'SKU must be at most 64 characters'),
  unit: z.nativeEnum(StockUnit),
  quantity: decimalUpTo('Enter a valid quantity', true).optional(),
  minQuantity: decimalUpTo('Enter a valid minimum quantity', true).optional(),
  costPrice: moneyUpTo('Enter a valid cost price').optional(),
  category: optionalClearedText(80, 'Category must be at most 80 characters'),
  expiryDate: optionalDateSchema,
  isActive: z.boolean().optional(),
});

export const updateInventoryItemSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be at most 120 characters').optional(),
    sku: optionalClearedText(64, 'SKU must be at most 64 characters'),
    unit: z.nativeEnum(StockUnit).optional(),
    minQuantity: decimalUpTo('Enter a valid minimum quantity', true).optional(),
    costPrice: moneyUpTo('Enter a valid cost price').optional(),
    category: optionalClearedText(80, 'Category must be at most 80 characters'),
    expiryDate: optionalDateSchema,
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const listInventoryItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  health: z.enum(['IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const recordTransactionSchema = z.object({
  type: z.nativeEnum(InventoryTransactionType),
  quantity: z
    .string()
    .trim()
    .regex(/^\d{1,9}(\.\d{1,3})?$/, 'Enter a valid quantity')
    .refine((value) => Number(value) > 0, 'Quantity must be greater than zero')
    .optional(),
  note: optionalClearedText(400, 'Note must be at most 400 characters'),
  unitCost: moneyUpTo('Enter a valid unit cost').optional(),
});

export const listInventoryTransactionsQuerySchema = z.object({
  itemId: idSchema.optional(),
  type: z.nativeEnum(InventoryTransactionType).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});