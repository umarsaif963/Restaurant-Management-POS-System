import type { AuthUser, CreateUserInput, UpdateUserInput } from '@restaurant/shared';
import { Prisma, UserRole, UserStatus } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword } from '../utils/password.js';
import { toAuthUser, userAuthSelect } from './user.mapper.js';

/**
 * Role hierarchy: only ADMIN and MANAGER manage staff. MANAGER can only manage
 * (create/update/deactivate) front-of-house roles, never other managers or
 * admins.
 */
const MANAGER_MANAGEABLE_ROLES: readonly UserRole[] = [
  UserRole.CASHIER,
  UserRole.WAITER,
  UserRole.KITCHEN_STAFF,
];

export function assertCanManage(actorRole: UserRole, targetRole: UserRole): void {
  if (actorRole === UserRole.ADMIN) {
    return;
  }
  if (actorRole === UserRole.MANAGER && MANAGER_MANAGEABLE_ROLES.includes(targetRole)) {
    return;
  }
  throw ApiError.forbidden('You do not have permission to manage this user');
}

export interface ListUsersParams {
  page: number;
  limit: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

export async function listUsers(params: ListUsersParams): Promise<{
  items: AuthUser[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}> {
  const where: Prisma.UserWhereInput = {};
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

  const [total, rows] = await prisma.$transaction([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
      select: userAuthSelect,
    }),
  ]);

  return {
    items: rows.map(toAuthUser),
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit),
  };
}

export async function getUserById(
  targetId: string,
  actorRole: UserRole,
): Promise<AuthUser> {
  const user = await prisma.user.findUnique({
    where: { id: targetId },
    select: userAuthSelect,
  });
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  assertCanManage(actorRole, user.role);
  return toAuthUser(user);
}

export async function createUser(
  params: CreateUserInput & { actorRole: UserRole },
): Promise<AuthUser> {
  assertCanManage(params.actorRole, params.role);

  const existing = await prisma.user.findUnique({
    where: { email: params.email },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict('A user with this email already exists');
  }

  const user = await prisma.user.create({
    data: {
      name: params.name,
      email: params.email,
      phone: params.phone ?? null,
      role: params.role,
      password: await hashPassword(params.password),
    },
    select: userAuthSelect,
  });

  return toAuthUser(user);
}

export async function updateUser(params: {
  targetId: string;
  actorUserId: string;
  actorRole: UserRole;
  data: UpdateUserInput;
}): Promise<AuthUser> {
  const existing = await prisma.user.findUnique({
    where: { id: params.targetId },
    select: { id: true, email: true, role: true },
  });
  if (!existing) {
    throw ApiError.notFound('User not found');
  }

  if (existing.id === params.actorUserId && params.data.role && params.data.role !== existing.role) {
    throw ApiError.forbidden('You cannot change your own role');
  }

  if (params.data.email && params.data.email !== existing.email) {
    const duplicate = await prisma.user.findUnique({
      where: { email: params.data.email },
      select: { id: true },
    });
    if (duplicate) {
      throw ApiError.conflict('A user with this email already exists');
    }
  }

  assertCanManage(params.actorRole, existing.role);
  assertCanManage(params.actorRole, params.data.role ?? existing.role);

  const updated = await prisma.user.update({
    where: { id: params.targetId },
    data: {
      ...(params.data.name !== undefined ? { name: params.data.name } : {}),
      ...(params.data.email !== undefined ? { email: params.data.email } : {}),
      ...(params.data.phone !== undefined ? { phone: params.data.phone } : {}),
      ...(params.data.role !== undefined ? { role: params.data.role } : {}),
      ...(params.data.password
        ? { password: await hashPassword(params.data.password) }
        : {}),
    },
    select: userAuthSelect,
  });

  return toAuthUser(updated);
}

/**
 * Soft-deletes a user (status INACTIVE) and revokes every active session so the
 * account is immediately locked out.
 */
export async function deactivateUser(params: {
  targetId: string;
  actorUserId: string;
  actorRole: UserRole;
}): Promise<void> {
  if (params.targetId === params.actorUserId) {
    throw ApiError.forbidden('You cannot deactivate your own account');
  }

  const existing = await prisma.user.findUnique({
    where: { id: params.targetId },
    select: { role: true },
  });
  if (!existing) {
    throw ApiError.notFound('User not found');
  }
  assertCanManage(params.actorRole, existing.role);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: params.targetId },
      data: { status: UserStatus.INACTIVE },
    }),
    prisma.session.updateMany({
      where: { userId: params.targetId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}