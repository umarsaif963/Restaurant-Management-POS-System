import type { UserRole, UserStatus } from '@prisma/client';
import type { AuthUser } from '@restaurant/shared';

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
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}