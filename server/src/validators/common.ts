import { z } from 'zod';

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(255, 'Email is too long');

export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(100, 'Name must be at most 100 characters');

/**
 * 8+ characters, at least one letter and one number. The 72-char cap aligns
 * with bcrypt's input limit.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/[0-9]/, 'Password must include a number');

/**
 * Optional phone: an empty string is normalized to `null` so the database and
 * API responses consistently use `null`.
 */
export const optionalPhoneSchema = z
  .string()
  .trim()
  .max(30, 'Phone must be at most 30 characters')
  .transform((value) => (value === '' ? null : value))
  .optional();

/**
 * Shared route param for any `:id` — cuid values are 25 chars.
 */
export const idSchema = z
  .string()
  .min(1, 'Identifier is required')
  .max(64, 'Identifier is too long');

export const resourceIdParamsSchema = z.object({
  id: idSchema,
});