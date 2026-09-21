import { z } from 'zod';
import { emailSchema, nameSchema, optionalPhoneSchema, resourceIdParamsSchema } from './common.js';

export { resourceIdParamsSchema };

const optionalClearedText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === '' ? null : value))
    .optional();

export const createCustomerSchema = z.object({
  name: nameSchema,
  phone: optionalPhoneSchema,
  email: emailSchema.optional(),
  address: optionalClearedText(300, 'Address must be at most 300 characters'),
  notes: optionalClearedText(1000, 'Notes must be at most 1000 characters'),
});

export const updateCustomerSchema = z
  .object({
    name: nameSchema.optional(),
    phone: optionalPhoneSchema,
    email: emailSchema.optional(),
    address: optionalClearedText(300, 'Address must be at most 300 characters'),
    notes: optionalClearedText(1000, 'Notes must be at most 1000 characters'),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const listCustomersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
});