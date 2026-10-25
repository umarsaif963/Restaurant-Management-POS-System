import { z } from 'zod';
import { Permission, UserRole, UserStatus } from '@prisma/client';
import { emailSchema, idSchema, nameSchema, optionalPhoneSchema, passwordSchema } from './common.js';

/**
 * Roles that may be handed to an employee. The platform super admin is never
 * assignable inside a restaurant.
 */
export const assignableUserRoleSchema = z.nativeEnum(UserRole).refine(
  (role) => role !== 'SUPER_ADMIN',
  'That role cannot be assigned inside a restaurant',
);

const permissionSchema = z.nativeEnum(Permission);

export const createEmployeeSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: optionalPhoneSchema,
  role: assignableUserRoleSchema,
  customRoleId: idSchema.nullable().optional(),
  extraPermissions: z.array(permissionSchema).max(100).optional(),
  restrictedPermissions: z.array(permissionSchema).max(100).optional(),
  password: passwordSchema.optional(),
});

export const updateEmployeeSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    phone: optionalPhoneSchema,
    role: assignableUserRoleSchema.optional(),
    customRoleId: idSchema.nullable().optional(),
    extraPermissions: z.array(permissionSchema).max(100).optional(),
    restrictedPermissions: z.array(permissionSchema).max(100).optional(),
    status: z.nativeEnum(UserStatus).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const listEmployeesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(100).optional(),
  role: z.nativeEnum(UserRole).optional(),
  status: z.nativeEnum(UserStatus).optional(),
});

export const employeeIdParamsSchema = z.object({
  id: idSchema,
});
