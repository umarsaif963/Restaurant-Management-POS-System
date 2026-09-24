import { z } from 'zod';
import { KitchenOrderStatus } from '@prisma/client';
import { idSchema, resourceIdParamsSchema } from './common.js';

export { resourceIdParamsSchema };

export const listKitchenOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(20),
  status: z.nativeEnum(KitchenOrderStatus).optional(),
  /**
   * Order KitchenOrderStatus differs from zodiac's string union expectations:
   * nativeEnum is the established pattern in this codebase.
   */
  orderId: idSchema.optional(),
});

export const updateKitchenOrderStatusSchema = z.object({
  status: z.nativeEnum(KitchenOrderStatus),
});