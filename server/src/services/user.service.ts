import type {
  CreateEmployeeInput,
  EmployeeProfile,
  ListEmployeesQuery,
  UpdateEmployeeInput,
  UserRole,
  UserStatus,
} from '@restaurant/shared';
import { Prisma, Permission, UserStatus as PrismaUserStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { generateTemporaryPassword, hashPassword } from '../utils/password.js';
import { toEmployeeProfile, userAuthSelect } from './user.mapper.js';

/**
 * The authenticated caller, as seen by the employee management service.
 */
export interface EmployeeActor {
  userId: string;
  role: UserRole;
  restaurantId: string | null;
  permissions: readonly string[];
}

/**
 * Roles a manager may manage. The restaurant owner (ADMIN) may manage every
 * restaurant role.
 */
const MANAGER_MANAGEABLE_ROLES: readonly UserRole[] = ['CASHIER', 'WAITER', 'KITCHEN_STAFF'];

/** Roles that may never be assigned inside a restaurant. */
const UNASSIGNABLE_ROLES: readonly UserRole[] = ['SUPER_ADMIN'];

function assertTenant(actor: EmployeeActor): string {
  if (!actor.restaurantId) {
    throw ApiError.forbidden('This action requires a restaurant workspace');
  }
  return actor.restaurantId;
}

/**
 * A restaurant must never be able to hand out platform-level powers, no matter
 * what the request body says.
 */
export function assertAssignableRole(role: UserRole): void {
  if (UNASSIGNABLE_ROLES.includes(role)) {
    throw ApiError.forbidden('That role cannot be assigned inside a restaurant');
  }
}

/**
 * Role hierarchy: the owner manages everyone inside the restaurant. A manager
 * may only manage front-of-house roles, never another manager or an admin.
 */
export function assertCanManage(actorRole: UserRole, targetRole: UserRole): void {
  if (actorRole === 'ADMIN') {
    return;
  }
  if (actorRole === 'MANAGER' && MANAGER_MANAGEABLE_ROLES.includes(targetRole)) {
    return;
  }
  throw ApiError.forbidden('You do not have permission to manage this employee');
}

/**
 * Strips platform permissions from a grant so a crafted request can never
 * escalate an employee to platform administrator.
 */
function sanitizePermissions(permissions: readonly Permission[] | undefined): Permission[] {
  return (permissions ?? []).filter((permission) => !permission.startsWith('PLATFORM_'));
}

export interface EmployeeListResult {
  items: EmployeeProfile[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export async function listEmployees(
  params: ListEmployeesQuery,
  actor: EmployeeActor,
): Promise<EmployeeListResult> {
  const restaurantId = assertTenant(actor);
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const where: Prisma.UserWhereInput = { restaurantId };
  if (params.role) {
    where.role = params.role;
  }
  if (params.status) {
    where.status = params.status;
  }
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { phone: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: userAuthSelect,
    }),
  ]);

  return {
    items: rows.map(toEmployeeProfile),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * Loads an employee inside the caller's restaurant. A record that belongs to
 * another restaurant is reported as "not found" - it never leaks its
 * existence.
 */
export async function getEmployee(
  targetId: string,
  actor: EmployeeActor,
): Promise<EmployeeProfile> {
  const restaurantId = assertTenant(actor);
  const user = await prisma.user.findFirst({
    where: { id: targetId, restaurantId },
    select: userAuthSelect,
  });
  if (!user) {
    throw ApiError.notFound('Employee not found');
  }
  return toEmployeeProfile(user);
}

async function assertCustomRoleBelongsToTenant(
  customRoleId: string | null | undefined,
  restaurantId: string,
): Promise<void> {
  if (!customRoleId) return;
  const role = await prisma.role.findFirst({
    where: { id: customRoleId, restaurantId },
    select: { id: true },
  });
  if (!role) {
    throw ApiError.notFound('Role not found');
  }
}

export interface CreateEmployeeResult {
  employee: EmployeeProfile;
  /** Only returned when the server generated a temporary password. */
  temporaryPassword?: string;
}

export async function createEmployee(
  input: CreateEmployeeInput,
  actor: EmployeeActor,
): Promise<CreateEmployeeResult> {
  const restaurantId = assertTenant(actor);
  assertAssignableRole(input.role);

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  await assertCustomRoleBelongsToTenant(input.customRoleId, restaurantId);

  const temporaryPassword = input.password ?? generateTemporaryPassword();

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      role: input.role,
      password: await hashPassword(temporaryPassword),
      restaurantId,
      roleId: input.customRoleId ?? null,
      extraPermissions: sanitizePermissions(input.extraPermissions),
      restrictedPermissions: sanitizePermissions(input.restrictedPermissions),
      mustChangePassword: !input.password,
      invitedById: actor.userId,
    },
    select: userAuthSelect,
  });

  return {
    employee: toEmployeeProfile(user),
    ...(input.password ? {} : { temporaryPassword }),
  };
}

export async function updateEmployee(
  targetId: string,
  input: UpdateEmployeeInput,
  actor: EmployeeActor,
): Promise<EmployeeProfile> {
  const restaurantId = assertTenant(actor);

  const existing = await prisma.user.findFirst({
    where: { id: targetId, restaurantId },
    select: {
      id: true,
      email: true,
      role: true,
      status: true,
      restaurantId: true,
    },
  });
  if (!existing) {
    throw ApiError.notFound('Employee not found');
  }

  if (existing.id === actor.userId) {
    if (input.role && input.role !== existing.role) {
      throw ApiError.forbidden('You cannot change your own role');
    }
    if (input.status && input.status !== existing.status) {
      throw ApiError.forbidden('You cannot change the status of your own account');
    }
  }

  if (input.role) {
    assertAssignableRole(input.role);
  }

  // The owner may manage every restaurant role; a manager may only manage the
  // front-of-house roles, and never may promote someone to owner.
  assertCanManage(actor.role, existing.role);
  if (input.role) {
    assertCanManage(actor.role, input.role);
  }

  if (input.email && input.email !== existing.email) {
    const duplicate = await prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true },
    });
    if (duplicate) {
      throw ApiError.conflict('An account with this email already exists');
    }
  }

  await assertCustomRoleBelongsToTenant(input.customRoleId, restaurantId);

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.phone !== undefined ? { phone: input.phone } : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.customRoleId !== undefined ? { roleId: input.customRoleId } : {}),
      ...(input.extraPermissions !== undefined
        ? { extraPermissions: sanitizePermissions(input.extraPermissions) }
        : {}),
      ...(input.restrictedPermissions !== undefined
        ? { restrictedPermissions: sanitizePermissions(input.restrictedPermissions) }
        : {}),
      ...(input.status !== undefined ? { status: input.status as PrismaUserStatus } : {}),
    },
    select: userAuthSelect,
  });

  // A deactivated or reactivated account must not keep an old session alive.
  if (input.status && input.status !== existing.status) {
    await prisma.session.updateMany({
      where: { userId: targetId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  return toEmployeeProfile(updated);
}

/**
 * Deactivates an employee and revokes every active session so the account is
 * locked out immediately.
 */
export async function deactivateEmployee(
  targetId: string,
  actor: EmployeeActor,
): Promise<void> {
  const restaurantId = assertTenant(actor);

  if (targetId === actor.userId) {
    throw ApiError.forbidden('You cannot deactivate your own account');
  }

  const existing = await prisma.user.findFirst({
    where: { id: targetId, restaurantId },
    select: { role: true },
  });
  if (!existing) {
    throw ApiError.notFound('Employee not found');
  }
  assertCanManage(actor.role, existing.role);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetId },
      data: { status: PrismaUserStatus.INACTIVE },
    }),
    prisma.session.updateMany({
      where: { userId: targetId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

/**
 * Reactivates a previously deactivated employee.
 */
export async function reactivateEmployee(
  targetId: string,
  actor: EmployeeActor,
): Promise<EmployeeProfile> {
  const restaurantId = assertTenant(actor);

  const existing = await prisma.user.findFirst({
    where: { id: targetId, restaurantId },
    select: { role: true },
  });
  if (!existing) {
    throw ApiError.notFound('Employee not found');
  }
  assertCanManage(actor.role, existing.role);

  const updated = await prisma.user.update({
    where: { id: targetId },
    data: { status: PrismaUserStatus.ACTIVE },
    select: userAuthSelect,
  });
  return toEmployeeProfile(updated);
}

/**
 * Issues a fresh temporary password for an employee and revokes their existing
 * sessions.
 */
export async function resetEmployeePassword(
  targetId: string,
  actor: EmployeeActor,
): Promise<{ temporaryPassword: string }> {
  const restaurantId = assertTenant(actor);

  const existing = await prisma.user.findFirst({
    where: { id: targetId, restaurantId },
    select: { role: true },
  });
  if (!existing) {
    throw ApiError.notFound('Employee not found');
  }
  assertCanManage(actor.role, existing.role);

  const temporaryPassword = generateTemporaryPassword();

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetId },
      data: {
        password: await hashPassword(temporaryPassword),
        mustChangePassword: true,
      },
    }),
    prisma.session.updateMany({
      where: { userId: targetId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);

  return { temporaryPassword };
}

/**
 * Re-exported for the shared status enum so controllers can validate without
 * importing Prisma directly.
 */
export const EMPLOYEE_STATUSES: readonly UserStatus[] = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];
