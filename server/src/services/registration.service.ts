import type { RegisterRestaurantInput, RegisterRestaurantResponse } from '@restaurant/shared';
import { prisma } from '../config/prisma.js';
import { runWithScope } from '../config/tenant-context.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword } from '../utils/password.js';
import { slugify } from '../utils/slug.js';
import { toAuthUser, userAuthSelect } from './user.mapper.js';

/**
 * Create a restaurant together with its owner account.
 *
 * Onboarding is a single, atomic unit: either the venue, its configuration
 * and its owner all exist, or nothing does. The new account is the restaurant
 * owner (`ADMIN`) and receives the full restaurant permission set.
 */
export async function registerRestaurant(
  input: RegisterRestaurantInput,
): Promise<RegisterRestaurantResponse> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists');
  }

  const slug = await uniqueSlug(input.restaurantName);

  const passwordHash = await hashPassword(input.password);

  // The restaurant row is created outside a tenant scope (no tenant exists
  // yet); everything that belongs to the new venue runs inside its scope.
  const restaurant = await prisma.restaurant.create({
    data: {
      name: input.restaurantName,
      slug,
      address: input.address ?? null,
      phone: input.phone ?? null,
      email: input.email,
      currency: input.currency ?? 'USD',
      status: 'ACTIVE',
      plan: 'STARTER',
    },
    select: { id: true, name: true, slug: true, status: true, plan: true },
  });

  try {
    const owner = await runWithScope({ kind: 'tenant', restaurantId: restaurant.id }, async () =>
      prisma.$transaction(async (tx) => {
        await tx.restaurantSettings.create({
          data: {
            restaurantId: restaurant.id,
            currency: input.currency ?? 'USD',
          },
        });

        const user = await tx.user.create({
          data: {
            name: input.ownerName,
            email: input.email,
            phone: input.phone ?? null,
            role: 'ADMIN',
            password: passwordHash,
            restaurantId: restaurant.id,
            mustChangePassword: false,
          },
          select: userAuthSelect,
        });

        await tx.restaurant.update({
          where: { id: restaurant.id },
          data: { ownerId: user.id },
        });

        return user;
      }),
    );

    return {
      user: toAuthUser(owner),
      restaurant: {
        id: restaurant.id,
        name: restaurant.name,
        slug: restaurant.slug,
        status: restaurant.status,
        plan: restaurant.plan,
      },
    };
  } catch (error) {
    // Onboarding is atomic: a venue whose owner could not be created is
    // removed again instead of being left behind without an account.
    await prisma.restaurant
      .delete({ where: { id: restaurant.id } })
      .catch(() => undefined);
    throw error;
  }
}

/**
 * Build a slug that is unique across the platform.
 */
async function uniqueSlug(name: string): Promise<string> {
  const base = slugify(name) || 'restaurant';
  let slug = base;
  let attempt = 1;
  while (true) {
    const existing = await prisma.restaurant.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!existing) return slug;
    attempt += 1;
    slug = `${base}-${attempt}`;
  }
}
