import { z } from 'zod';
import { emailSchema } from './common.js';

const MAX = {
  logoUrl: 500,
  text: 300,
  longText: 1000,
  phone: 40,
} as const;

/**
 * Optional string where an empty value clears the field (null). Accepts a URL
 * when actually provided.
 */
export const optionalClearedText =
  (max: number, message: string) =>
    z
      .string()
      .trim()
      .max(max, message)
      .transform((value) => (value === '' ? null : value))
      .optional();

const optionalUrlSchema = z
  .string()
  .trim()
  .max(MAX.logoUrl, 'URL must be at most 500 characters')
  .transform((value) => (value === '' ? null : value))
  .pipe(z.union([z.null(), z.string().url('Enter a valid URL')]))
  .optional();

export const percentageSchema = z
  .string()
  .trim()
  .regex(/^\d{1,3}(\.\d{1,2})?$/, 'Enter a valid percentage (e.g. 10 or 7.5)')
  .optional();

export const currencySchema = z
  .string()
  .trim()
  .length(3, 'Currency must be a 3-letter code')
  .toUpperCase()
  .optional();

const updateRestaurantSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Name is required')
      .max(120, 'Name must be at most 120 characters')
      .optional(),
    logoUrl: optionalUrlSchema,
    address: optionalClearedText(MAX.text, 'Address must be at most 300 characters'),
    phone: optionalClearedText(MAX.phone, 'Phone must be at most 40 characters'),
    email: emailSchema.optional(),
    currency: currencySchema,
    taxPercentage: percentageSchema,
    serviceChargePct: percentageSchema,
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

const updateSettingsSchema = z
  .object({
    currency: currencySchema,
    taxPercentage: percentageSchema,
    serviceChargePct: percentageSchema,
    receiptHeader: optionalClearedText(
      MAX.longText,
      'Receipt header must be at most 1000 characters',
    ),
    receiptFooter: optionalClearedText(
      MAX.longText,
      'Receipt footer must be at most 1000 characters',
    ),
    orderNumberPrefix: z
      .string()
      .trim()
      .min(1, 'Order number prefix is required')
      .max(12, 'Order number prefix must be at most 12 characters')
      .optional(),
    showTaxOnReceipt: z.boolean().optional(),
    showServiceChargeOnReceipt: z.boolean().optional(),
    openingHours: z
      .record(z.string().min(1).max(3), z.string().min(1, 'Cannot be empty').max(60))
      .nullable()
      .optional(),
  })
  .refine((data) => Object.values(data).some((value) => value !== undefined), {
    message: 'Provide at least one field to update',
  });

export const updateSettingsBodySchema = z
  .object({
    restaurant: updateRestaurantSchema.optional(),
    settings: updateSettingsSchema.optional(),
  })
  .refine((data) => data.restaurant !== undefined || data.settings !== undefined, {
    message: 'Provide restaurant or settings data to update',
  });