import { z } from 'zod';
import { idSchema } from './common.js';

export const resourceIdParamsSchema = z.object({ id: idSchema });

const quantitySchema = z
  .string()
  .trim()
  .regex(/^\d{1,9}(\.\d{1,3})?$/, 'Enter a valid quantity')
  .refine((value) => Number(value) > 0, 'Quantity must be greater than zero');

const ingredientSchema = z.object({
  inventoryItemId: idSchema,
  quantity: quantitySchema,
});

export const createRecipeSchema = z.object({
  menuItemId: idSchema,
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be at most 120 characters'),
  yield: z.number().int().min(1, 'Yield must be at least 1').max(10_000).optional(),
  ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required').max(100, 'Too many ingredients'),
});

export const updateRecipeSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be at most 120 characters').optional(),
    yield: z.number().int().min(1, 'Yield must be at least 1').max(10_000).optional(),
    ingredients: z.array(ingredientSchema).min(1, 'At least one ingredient is required').max(100, 'Too many ingredients').optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const listRecipesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
});