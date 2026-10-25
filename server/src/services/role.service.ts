import type { Permission } from '@prisma/client';
import type { CreateRoleInput, RoleProfile, UpdateRoleInput } from '@restaurant/shared';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { slugify } from '../utils/slug.js';

/**
 * The authenticated caller, as seen by the role management service.
 */
export interface RoleActor {
  userId: string;
  restaurantId: string | null;
}

function assertTenant(actor: RoleActor): string {
  if (!actor.restaurantId) {
    throw ApiError.forbidden('This action requires a restaurant workspace');
  }
  return actor.restaurantId;
}

/**
 * Platform capabilities are reserved for the platform operator. A custom role
 * inside a restaurant can never contain them.
 */
function stripPlatformPermissions(permissions: readonly Permission[]): Permission[] {
  return permissions.filter((permission) => !permission.startsWith('PLATFORM_'));
}

function toRoleProfile(
  role: {
    id: string;
    restaurantId: string;
    name: string;
    slug: string;
    description: string | null;
    permissions: Permission[];
    isSystem: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count?: { members: number };
  },
): RoleProfile {
  return {
    id: role.id,
    restaurantId: role.restaurantId,
    name: role.name,
    slug: role.slug,
    description: role.description,
    permissions: role.permissions as never,
    isSystem: role.isSystem,
    memberCount: role._count?.members ?? 0,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export async function listRoles(actor: RoleActor): Promise<RoleProfile[]> {
  const restaurantId = assertTenant(actor);
  const roles = await prisma.role.findMany({
    where: { restaurantId },
    orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    include: { _count: { select: { members: true } } },
  });
  return roles.map(toRoleProfile);
}

export async function getRole(roleId: string, actor: RoleActor): Promise<RoleProfile> {
  const restaurantId = assertTenant(actor);
  const role = await prisma.role.findFirst({
    where: { id: roleId, restaurantId },
    include: { _count: { select: { members: true } } },
  });
  if (!role) {
    throw ApiError.notFound('Role not found');
  }
  return toRoleProfile(role);
}

export async function createRole(
  input: CreateRoleInput,
  actor: RoleActor,
): Promise<RoleProfile> {
  const restaurantId = assertTenant(actor);

  const base = slugify(input.name) || 'role';
  let slug = base;
  let attempt = 1;
  while (true) {
    const existing = await prisma.role.findFirst({
      where: { restaurantId, slug },
      select: { id: true },
    });
    if (!existing) break;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  const role = await prisma.role.create({
    data: {
      restaurantId,
      name: input.name,
      slug,
      description: input.description ?? null,
      permissions: stripPlatformPermissions(input.permissions),
      isSystem: false,
    },
    include: { _count: { select: { members: true } } },
  });
  return toRoleProfile(role);
}

export async function updateRole(
  roleId: string,
  input: UpdateRoleInput,
  actor: RoleActor,
): Promise<RoleProfile> {
  const restaurantId = assertTenant(actor);

  const existing = await prisma.role.findFirst({
    where: { id: roleId, restaurantId },
    select: { id: true, isSystem: true },
  });
  if (!existing) {
    throw ApiError.notFound('Role not found');
  }
  if (existing.isSystem) {
    throw ApiError.forbidden('Built-in roles cannot be modified');
  }

  const role = await prisma.role.update({
    where: { id: roleId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.permissions !== undefined
        ? { permissions: stripPlatformPermissions(input.permissions) }
        : {}),
    },
    include: { _count: { select: { members: true } } },
  });
  return toRoleProfile(role);
}

/**
 * Deletes a custom role. Roles that are still attached to employees cannot be
 * removed - the employees have to be moved to another role first, so nobody
 * silently loses their access.
 */
export async function deleteRole(roleId: string, actor: RoleActor): Promise<void> {
  const restaurantId = assertTenant(actor);

  const existing = await prisma.role.findFirst({
    where: { id: roleId, restaurantId },
    select: { id: true, isSystem: true, _count: { select: { members: true } } },
  });
  if (!existing) {
    throw ApiError.notFound('Role not found');
  }
  if (existing.isSystem) {
    throw ApiError.forbidden('Built-in roles cannot be deleted');
  }
  if (existing._count.members > 0) {
    throw ApiError.conflict(
      'This role is still assigned to employees. Reassign them before deleting it.',
    );
  }

  await prisma.role.delete({ where: { id: roleId } });
}
