import { z } from 'zod';
import { MenuItemStatus } from '@prisma/client';
import { idSchema, resourceIdParamsSchema } from './common.js';

export { resourceIdParamsSchema };

const menuNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters');

const categoryDescriptionSchema = z
  .string()
  .trim()
  .max(300, 'Description must be at most 300 characters')
  .transform((value) => (value === '' ? null : value))
  .optional();

const positionSchema = z
  .number()
  .int()
  .min(0, 'Position cannot be negative')
  .max(100_000, 'Position is too large')
  .optional();

// ---- Currency amounts / rates --------------------------------

const optionalClearedText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === '' ? null : value))
    .optional();

const moneySchema = z
  .string()
  .trim()
  .regex(/^\d{1,6}(\.\d{1,2})?$/, 'Enter a valid price, e.g. 9.50');

const signedMoneySchema = z
  .string()
  .trim()
  .regex(/^-?\d{1,6}(\.\d{1,2})?$/, 'Enter a valid adjustment, e.g. 1.50 or -2.00');

const taxRateSchema = z
  .string()
  .trim()
  .regex(/^\d{1,3}(\.\d{1,2})?$/, 'Enter a valid percentage')
  .optional();

const prepTimeSchema = z
  .number()
  .int()
  .min(1, 'Preparation time must be at least 1 minute')
  .max(999, 'Preparation time is too large')
  .nullable()
  .optional();

const skuSchema = z
  .string()
  .trim()
  .toUpperCase()
  .max(20, 'SKU must be at most 20 characters')
  .transform((value) => (value === '' ? null : value))
  .optional();

// ---- Categories ----------------------------------------------

export const createMenuCategorySchema = z.object({
  name: menuNameSchema,
  description: categoryDescriptionSchema,
  position: positionSchema,
});

export const updateMenuCategorySchema = z
  .object({
    name: menuNameSchema.optional(),
    description: categoryDescriptionSchema,
    position: positionSchema,
    status: z.nativeEnum(MenuItemStatus).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

// ---- Variations & add-ons ------------------------------------

const variationSchema = z.object({
  name: menuNameSchema,
  priceAdjustment: signedMoneySchema.optional(),
  isDefault: z.boolean().optional(),
});

const addOnSchema = z.object({
  name: menuNameSchema,
  price: moneySchema,
  available: z.boolean().optional(),
});

export const createVariationSchema = variationSchema;

export const updateVariationSchema = variationSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const createAddOnSchema = addOnSchema;

export const updateAddOnSchema = addOnSchema
  .partial()
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const itemIdParamsSchema = z.object({
  itemId: idSchema,
});

// ---- Menu items ----------------------------------------------

export const createMenuItemSchema = z.object({
  name: menuNameSchema,
  price: moneySchema,
  categoryId: z.string().min(1, 'Category is required').max(64, 'Category id is too long'),
  sku: skuSchema,
  description: optionalClearedText(500, 'Description must be at most 500 characters'),
  taxRate: taxRateSchema,
  preparationTime: prepTimeSchema,
  available: z.boolean().optional(),
  imageUrl: optionalClearedText(500, 'Image URL must be at most 500 characters'),
  position: positionSchema,
  variations: z.array(variationSchema).max(30, 'Too many variations').optional(),
  addOns: z.array(addOnSchema).max(50, 'Too many add-ons').optional(),
});

export const updateMenuItemSchema = z
  .object({
    name: menuNameSchema.optional(),
    price: moneySchema.optional(),
    categoryId: z.string().min(1).max(64).optional(),
    sku: skuSchema,
    description: optionalClearedText(500, 'Description must be at most 500 characters'),
    taxRate: taxRateSchema,
    preparationTime: prepTimeSchema,
    available: z.boolean().optional(),
    imageUrl: optionalClearedText(500, 'Image URL must be at most 500 characters'),
    position: positionSchema,
    status: z.nativeEnum(MenuItemStatus).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const listMenuItemsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  categoryId: z.string().min(1).max(64).optional(),
  status: z.nativeEnum(MenuItemStatus).optional(),
});