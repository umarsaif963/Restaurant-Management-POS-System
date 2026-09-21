import { z } from 'zod';
import { UserRole, UserStatus } from '@prisma/client';
import { emailSchema, nameSchema, optionalPhoneSchema, passwordSchema } from './common.js';

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
  role: z.nativeEnum(UserRole),
  password: passwordSchema,
});

export const updateUserSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    phone: optionalPhoneSchema,
    role: z.nativeEnum(UserRole).optional(),
    password: passwordSchema.optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const userIdParamsSchema = z.object({
  id: z.string().min(1).max(64),
});