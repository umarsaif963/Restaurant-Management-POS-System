import type {
  PlatformRestaurantProfile,
  PlatformStats,
  UpdatePlatformRestaurantInput,
} from '@restaurant/shared';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

function toProfile(
  restaurant: {
    id: string;
    name: string;
    slug: string;
    status: PlatformRestaurantProfile['status'];
    plan: PlatformRestaurantProfile['plan'];
    email: string | null;
    phone: string | null;
    address: string | null;
    createdAt: Date;
    updatedAt: Date;
    owner?: { name: string; email: string } | null;
    _count?: { members: number; orders: number };
  },
): PlatformRestaurantProfile {
  return {
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    status: restaurant.status,
    plan: restaurant.plan,
    email: restaurant.email,
    phone: restaurant.phone,
    address: restaurant.address,
    ownerName: restaurant.owner?.name ?? null,
    ownerEmail: restaurant.owner?.email ?? null,
    employeeCount: restaurant._count?.members ?? 0,
    orderCount: restaurant._count?.orders ?? 0,
    createdAt: restaurant.createdAt.toISOString(),
    updatedAt: restaurant.updatedAt.toISOString(),
  };
}

export async function listRestaurants(params: {
  search?: string;
  status?: PlatformRestaurantProfile['status'];
  plan?: PlatformRestaurantProfile['plan'];
}): Promise<PlatformRestaurantProfile[]> {
  const where = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.plan ? { plan: params.plan } : {}),
    ...(params.search
      ? {
          OR: [
            { name: { contains: params.search, mode: 'insensitive' as const } },
            { slug: { contains: params.search, mode: 'insensitive' as const } },
            { email: { contains: params.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const restaurants = await prisma.restaurant.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { members: true, orders: true } },
    },
  });

  return restaurants.map(toProfile);
}

export async function getPlatformStats(): Promise<PlatformStats> {
  const [totalRestaurants, activeRestaurants, suspendedRestaurants, totalUsers, totalOrders, restaurants] =
    await Promise.all([
      prisma.restaurant.count(),
      prisma.restaurant.count({ where: { status: 'ACTIVE' } }),
      prisma.restaurant.count({ where: { status: 'SUSPENDED' } }),
      prisma.user.count({ where: { restaurantId: { not: null } } }),
      prisma.order.count(),
      listRestaurants({}),
    ]);

  return {
    totalRestaurants,
    activeRestaurants,
    suspendedRestaurants,
    totalUsers,
    totalOrders,
    restaurants,
  };
}

/**
 * Activate, suspend or re-plan a restaurant.
 */
export async function updateRestaurant(
  restaurantId: string,
  input: UpdatePlatformRestaurantInput,
): Promise<PlatformRestaurantProfile> {
  const existing = await prisma.restaurant.findUnique({
    where: { id: restaurantId },
    select: { id: true },
  });
  if (!existing) {
    throw ApiError.notFound('Restaurant not found');
  }

  const updated = await prisma.restaurant.update({
    where: { id: restaurantId },
    data: {
      ...(input.status ? { status: input.status } : {}),
      ...(input.plan ? { plan: input.plan } : {}),
      ...(input.name ? { name: input.name } : {}),
    },
    include: {
      owner: { select: { name: true, email: true } },
      _count: { select: { members: true, orders: true } },
    },
  });

  // A suspended venue must not keep working sessions alive.
  if (input.status === 'SUSPENDED') {
    await prisma.session.updateMany({
      where: {
        revokedAt: null,
        user: { restaurantId },
      },
      data: { revokedAt: new Date() },
    });
  }

  return toProfile(updated);
}
