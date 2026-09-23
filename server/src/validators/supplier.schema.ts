import { z } from 'zod';
import { nameSchema, resourceIdParamsSchema } from './common.js';

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

export const supplierParamsSchema = resourceIdParamsSchema;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(255, 'Email is too long')
  .transform((value) => value)
  .nullable()
  .optional();

export const createSupplierSchema = z.object({
  name: nameSchema,
  company: optionalText(120, 'Company must be at most 120 characters'),
  phone: optionalText(30, 'Phone must be at most 30 characters'),
  email: emailSchema,
  address: optionalText(200, 'Address must be at most 200 characters'),
  notes: optionalText(400, 'Notes must be at most 400 characters'),
});

export const updateSupplierSchema = z
  .object({
    name: nameSchema.optional(),
    company: optionalText(120, 'Company must be at most 120 characters'),
    phone: optionalText(30, 'Phone must be at most 30 characters'),
    email: emailSchema,
    address: optionalText(200, 'Address must be at most 200 characters'),
    notes: optionalText(400, 'Notes must be at most 400 characters'),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const listSuppliersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
});