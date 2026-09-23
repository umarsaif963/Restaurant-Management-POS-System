import { z } from 'zod';
import { PaymentMethod } from '@prisma/client';
import { idSchema } from './common.js';

export const paymentParamsSchema = z.object({
  id: idSchema,
});

export const refundParamsSchema = z.object({
  id: idSchema,
  paymentId: idSchema,
});

const amountSchema = z
  .string()
  .trim()
  .regex(/^\d{1,8}(\.\d{1,2})?$/, 'Enter a valid amount (up to 8 digits, 2 decimals)')
  .refine((value) => Number(value) > 0, 'Amount must be greater than zero');

const optionalClearedText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, message)
    .transform((value) => (value === '' ? null : value))
    .nullable()
    .optional();

export const recordPaymentSchema = z.object({
  amount: amountSchema,
  method: z.nativeEnum(PaymentMethod),
  transactionRef: optionalClearedText(100, 'Transaction reference must be at most 100 characters'),
  notes: optionalClearedText(300, 'Notes must be at most 300 characters'),
});

export const refundPaymentSchema = z.object({
  amount: amountSchema,
  method: z.nativeEnum(PaymentMethod).optional(),
  transactionRef: optionalClearedText(100, 'Transaction reference must be at most 100 characters'),
  notes: optionalClearedText(300, 'Notes must be at most 300 characters'),
});