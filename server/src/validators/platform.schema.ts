import { z } from 'zod';
import { RestaurantStatus, SubscriptionPlan } from '@prisma/client';
import { idSchema } from './common.js';

export const listPlatformRestaurantsQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  status: z.nativeEnum(RestaurantStatus).optional(),
  plan: z.nativeEnum(SubscriptionPlan).optional(),
});

export const platformRestaurantIdParamsSchema = z.object({
  id: idSchema,
});

export const updatePlatformRestaurantSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    status: z.nativeEnum(RestaurantStatus).optional(),
    plan: z.nativeEnum(SubscriptionPlan).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });
