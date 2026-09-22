import { z } from 'zod';
import { OrderStatus, OrderType, PaymentStatus } from '@prisma/client';
import { idSchema, resourceIdParamsSchema } from './common.js';

export { resourceIdParamsSchema };

const optionalClearedText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

const optionalClearedId = z
  .string()
  .trim()
  .max(64, 'Identifier is too long')
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional();

const quantitySchema = z
  .number()
  .int()
  .min(1, 'Quantity must be at least 1')
  .max(99, 'Quantity must be at most 99');

export const createOrderItemSchema = z.object({
  menuItemId: idSchema,
  quantity: quantitySchema.optional(),
  variationId: idSchema.optional(),
  addOnIds: z.array(idSchema).max(20, 'Too many add-ons').optional(),
  notes: optionalClearedText(300, 'Item notes must be at most 300 characters'),
});

export const createOrderSchema = z.object({
  orderType: z.nativeEnum(OrderType).optional(),
  tableId: optionalClearedId,
  customerId: optionalClearedId,
  notes: optionalClearedText(1000, 'Notes must be at most 1000 characters'),
  kitchenNotes: optionalClearedText(1000, 'Kitchen notes must be at most 1000 characters'),
  discountAmount: z
    .string()
    .trim()
    .regex(/^\d{1,6}(\.\d{1,2})?$/, 'Enter a valid discount amount')
    .optional(),
  items: z
    .array(createOrderItemSchema)
    .min(1, 'At least one item is required')
    .max(100, 'Too many items in one order'),
});

export const addOrderItemsSchema = z.object({
  items: z
    .array(createOrderItemSchema)
    .min(1, 'At least one item is required')
    .max(100, 'Too many items'),
});

export const updateOrderSchema = z
  .object({
    notes: optionalClearedText(1000, 'Notes must be at most 1000 characters'),
    kitchenNotes: optionalClearedText(1000, 'Kitchen notes must be at most 1000 characters'),
    customerId: optionalClearedId,
    tableId: optionalClearedId,
    orderType: z.nativeEnum(OrderType).optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const updateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  cancelledReason: z
    .string()
    .trim()
    .min(1, 'A reason is required to cancel an order')
    .max(300, 'Reason must be at most 300 characters')
    .optional(),
});

export const listOrdersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(OrderStatus).optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
  orderType: z.nativeEnum(OrderType).optional(),
  search: z.string().trim().max(100).optional(),
});

export const orderItemParamsSchema = z.object({
  id: idSchema,
  itemId: idSchema,
});