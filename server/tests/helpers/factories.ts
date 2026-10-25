import type { Permission, UserRole } from '@prisma/client';
import { prisma } from '../../src/config/prisma.js';
import { runWithScope } from '../../src/config/tenant-context.js';
import { hashPassword } from '../../src/utils/password.js';

export interface TenantFixture {
  restaurantId: string;
  ownerId: string;
}

export interface PlatformFixture {
  superAdminId: string;
}

let counter = 0;

function unique(prefix: string): string {
  counter += 1;
  return `${prefix}.${counter}.${Date.now()}`;
}

/**
 * Creates a restaurant with its owner account. The rows are written without a
 * tenant scope on purpose: the tenant does not exist yet.
 */
export async function createTenant(options?: {
  name?: string;
  ownerEmail?: string;
  role?: UserRole;
}): Promise<TenantFixture> {
  const name = options?.name ?? 'Test Kitchen';
  const slug = unique('tenant').toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const ownerEmail = options?.ownerEmail ?? `${unique('owner')}@test.local`;

  const restaurant = await prisma.restaurant.create({
    data: {
      name,
      slug,
      currency: 'USD',
      status: 'ACTIVE',
      plan: 'STARTER',
    },
    select: { id: true },
  });

  const owner = await prisma.user.create({
    data: {
      name: `${name} Owner`,
      email: ownerEmail,
      role: options?.role ?? 'ADMIN',
      password: await hashPassword('Owner@12345'),
      restaurantId: restaurant.id,
    },
    select: { id: true },
  });

  await prisma.restaurant.update({
    where: { id: restaurant.id },
    data: { ownerId: owner.id },
  });

  return { restaurantId: restaurant.id, ownerId: owner.id };
}

/** Creates a platform operator that belongs to no restaurant. */
export async function createPlatformAdmin(): Promise<PlatformFixture> {
  const user = await prisma.user.create({
    data: {
      name: 'Platform Operator',
      email: `${unique('platform')}@test.local`,
      role: 'SUPER_ADMIN',
      password: await hashPassword('Platform@12345'),
      restaurantId: null,
    },
    select: { id: true },
  });
  return { superAdminId: user.id };
}

/** Creates an employee inside a restaurant. */
export async function createEmployee(
  restaurantId: string,
  options?: {
    email?: string;
    role?: UserRole;
    extraPermissions?: Permission[];
    restrictedPermissions?: Permission[];
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    roleId?: string;
  },
) {
  const password = await hashPassword('Employee@12345');
  return runWithScope({ kind: 'tenant', restaurantId }, () =>
    prisma.user.create({
      data: {
        name: options?.email ?? 'Employee',
        email: options?.email ?? `${unique('employee')}@test.local`,
        role: options?.role ?? 'WAITER',
        password,
        restaurantId,
        roleId: options?.roleId ?? null,
        extraPermissions: options?.extraPermissions ?? [],
        restrictedPermissions: options?.restrictedPermissions ?? [],
        status: options?.status ?? 'ACTIVE',
      },
    }),
  );
}

/** Creates a custom role inside a restaurant. */
export async function createRole(
  restaurantId: string,
  options?: { name?: string; permissions?: Permission[]; isSystem?: boolean },
) {
  const name = options?.name ?? 'Shift Lead';
  return runWithScope({ kind: 'tenant', restaurantId }, () =>
    prisma.role.create({
      data: {
        restaurantId,
        name,
        slug: unique('role').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        permissions: options?.permissions ?? ['POS_USE', 'ORDERS_READ'],
        isSystem: options?.isSystem ?? false,
      },
    }),
  );
}

/** Creates a customer inside a restaurant. */
export async function createCustomer(
  restaurantId: string,
  name: string,
): Promise<{ id: string; restaurantId: string }> {
  return runWithScope({ kind: 'tenant', restaurantId }, () =>
    prisma.customer.create({
      data: { restaurantId, name, email: `${name}@test.local` },
      select: { id: true, restaurantId: true },
    }),
  );
}
