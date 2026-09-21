import type { UpdateSettingsInput, SettingsView } from '@restaurant/shared';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { toSettingsView } from './settings.mapper.js';

/**
 * Single-tenant restaurant configuration (module 4). The seed creates exactly
 * one `Restaurant` plus its `RestaurantSettings` row.
 */
export async function getSettings(): Promise<SettingsView> {
  const record = await prisma.restaurantSettings.findFirst({
    include: { restaurant: true },
  });
  if (!record) {
    throw ApiError.notFound('Restaurant settings not found');
  }
  return toSettingsView(record);
}

async function requireSettings(): Promise<{ id: string; restaurantId: string }> {
  const record = await prisma.restaurantSettings.findFirst({
    select: { id: true, restaurantId: true },
  });
  if (!record) {
    throw ApiError.notFound('Restaurant settings not found');
  }
  return record;
}

/**
 * Prisma stores SQL NULL for a `Json?` column via `Prisma.DbNull`; passing a
 * plain `null` is not assignable.
 */
function buildSettingsData(
  input: Exclude<UpdateSettingsInput['settings'], undefined>,
): Prisma.RestaurantSettingsUpdateInput {
  const data: Prisma.RestaurantSettingsUpdateInput = {};
  Object.assign(data, input);
  if ('openingHours' in input) {
    data.openingHours =
      input.openingHours === null ? Prisma.DbNull : input.openingHours;
  }
  return data;
}

export async function updateSettings(input: UpdateSettingsInput): Promise<SettingsView> {
  const current = await requireSettings();

  await prisma.$transaction([
    ...(input.restaurant
      ? [
        prisma.restaurant.update({
          where: { id: current.restaurantId },
          data: { ...input.restaurant },
        }),
      ]
      : []),
    ...(input.settings
      ? [
        prisma.restaurantSettings.update({
          where: { id: current.id },
          data: buildSettingsData(input.settings),
        }),
      ]
      : []),
  ]);

  return getSettings();
}