import { z } from 'zod';
import { Permission } from '@prisma/client';
import { idSchema, nameSchema } from './common.js';

export const createRoleSchema = z.object({
  name: nameSchema,
  description: z
    .string()
    .trim()
    .max(255, 'Description must be at most 255 characters')
    .transform((value) => (value === '' ? null : value))
    .optional(),
  permissions: z.array(z.nativeEnum(Permission)).max(100),
});

export const updateRoleSchema = z
  .object({
    name: nameSchema.optional(),
    description: z
      .string()
      .trim()
      .max(255, 'Description must be at most 255 characters')
      .transform((value) => (value === '' ? null : value))
      .optional(),
    permissions: z.array(z.nativeEnum(Permission)).max(100).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const listRolesQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
});

export const roleIdParamsSchema = z.object({
  id: idSchema,
});
