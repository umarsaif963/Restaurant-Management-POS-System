import type { Permission, UserRole } from '@prisma/client';
import { resolvePermissions, withoutPlatformPermissions } from '@restaurant/shared';
import type { Prisma } from '@prisma/client';

/**
 * The subset of a user row needed to resolve the effective permission set.
 */
export interface PermissionSubject {
  role: UserRole;
  extraPermissions: Permission[];
  restrictedPermissions: Permission[];
  customRole: { permissions: Permission[] } | null;
  /** Raw permission list of the attached custom role, if any. */
  customRolePermissions?: Permission[] | null;
}

/**
 * Resolve the capabilities of an account.
 *
 * A custom role replaces the built-in role's default set entirely, so an
 * owner has exact control over what a custom role may do. Individual
 * permissions can then be granted or revoked on top of that.
 */
export function resolveUserPermissions(subject: PermissionSubject): Permission[] {
  const resolved = resolvePermissions({
    role: subject.role as never,
    customRolePermissions: subject.customRolePermissions ?? null,
    extraPermissions: subject.extraPermissions ?? null,
    restrictedPermissions: subject.restrictedPermissions ?? null,
  }) as Permission[];

  // Only the platform operator may hold platform capabilities. A custom role
  // or a per-account grant can never introduce them.
  if (subject.role === 'SUPER_ADMIN') {
    return resolved;
  }
  return withoutPlatformPermissions(resolved as never) as Permission[];
}

/**
 * Prisma select that returns everything required to resolve permissions and
 * to describe the account in the client.
 */
export const permissionSubjectSelect = {
  role: true,
  extraPermissions: true,
  restrictedPermissions: true,
  customRole: { select: { permissions: true } },
} satisfies Prisma.UserSelect;

/**
 * True when the account is the platform operator.
 */
export function isPlatformRole(role: UserRole): boolean {
  return role === 'SUPER_ADMIN';
}
