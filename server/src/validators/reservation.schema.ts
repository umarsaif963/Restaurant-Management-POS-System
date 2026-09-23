import { z } from 'zod';
import { ReservationStatus } from '@prisma/client';
import { nameSchema, optionalPhoneSchema, resourceIdParamsSchema } from './common.js';

export const reservationParamsSchema = resourceIdParamsSchema;

const RESERVATION_WINDOW_HOURS = 2;

const optionalIdSchema = z
  .string()
  .trim()
  .max(64, 'Identifier is too long')
  .transform((value) => (value === '' ? null : value))
  .nullable()
  .optional();

const optionalClearedText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

/**
 * Reservation dates are ISO 8601 datetimes (the client sends UTC ISO strings).
 * The clarified timezone keeps naive timestamps from being silently accepted.
 */
const dateSchema = z
  .string()
  .datetime({ offset: true, message: 'Provide a valid reservation date and time (ISO 8601)' });

const guestsSchema = z
  .coerce.number()
  .int('Party size must be a whole number')
  .min(1, 'Party size must be at least 1')
  .max(50, 'Party size must be at most 50');

export const createReservationSchema = z.object({
  customerName: nameSchema,
  phone: optionalPhoneSchema,
  customerId: optionalIdSchema,
  tableId: optionalIdSchema,
  guests: guestsSchema,
  date: dateSchema,
  notes: optionalClearedText(1000, 'Notes must be at most 1000 characters'),
});

export const updateReservationSchema = z
  .object({
    customerName: nameSchema.optional(),
    phone: optionalPhoneSchema,
    customerId: optionalIdSchema,
    tableId: optionalIdSchema,
    guests: guestsSchema.optional(),
    date: dateSchema.optional(),
    notes: optionalClearedText(1000, 'Notes must be at most 1000 characters'),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const changeReservationStatusSchema = z.object({
  status: z.enum([ReservationStatus.CONFIRMED, ReservationStatus.SEATED, ReservationStatus.COMPLETED, ReservationStatus.CANCELLED]),
});

export const listReservationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  status: z.nativeEnum(ReservationStatus).optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
});

export { RESERVATION_WINDOW_HOURS };