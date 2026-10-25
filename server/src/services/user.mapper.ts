import type { Permission, UserRole, UserStatus } from '@prisma/client';
import type { AuthUser, EmployeeProfile } from '@restaurant/shared';
import { resolveUserPermissions } from './permission.service.js';

/**
 * Structural row returned by Prisma queries that use `userAuthSelect`.
 */
export interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  restaurantId: string | null;
  restaurant?: { name: string; slug: string } | null;
  extraPermissions: Permission[];
  restrictedPermissions: Permission[];
  mustChangePassword: boolean;
  customRole?: {
    id: string;
    name: string;
    permissions: Permission[];
  } | null;
  invitedBy?: { name: string } | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export const userAuthSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  restaurantId: true,
  restaurant: { select: { name: true, slug: true } },
  extraPermissions: true,
  restrictedPermissions: true,
  mustChangePassword: true,
  customRole: { select: { id: true, name: true, permissions: true } },
  invitedBy: { select: { name: true } },
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * Convert a database user row into the sanitized, JSON-friendly shape shared
 * with the client (ISO strings, no password hash).
 */
export function toAuthUser(row: UserRow): AuthUser {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    status: row.status,
    restaurantId: row.restaurantId,
    restaurantName: row.restaurant?.name ?? null,
    restaurantSlug: row.restaurant?.slug ?? null,
    permissions: resolveUserPermissions({
      role: row.role,
      extraPermissions: row.extraPermissions,
      restrictedPermissions: row.restrictedPermissions,
      customRole: row.customRole ? { permissions: row.customRole.permissions } : null,
      customRolePermissions: row.customRole?.permissions ?? null,
    }) as never,
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Employee view: the sanitized user plus the account-management details the
 * owner needs (custom role, invitation state, who created the account).
 */
export function toEmployeeProfile(row: UserRow): EmployeeProfile {
  return {
    ...toAuthUser(row),
    customRoleId: row.customRole?.id ?? null,
    customRoleName: row.customRole?.name ?? null,
    extraPermissions: row.extraPermissions as never,
    restrictedPermissions: row.restrictedPermissions as never,
    mustChangePassword: row.mustChangePassword,
    invitedByName: row.invitedBy?.name ?? null,
  };
}