import { z } from 'zod';
import { emailSchema, nameSchema, optionalPhoneSchema, passwordSchema } from './common.js';

/**
 * Public restaurant sign-up. The account created here always becomes the
 * restaurant owner (ADMIN) of a brand new tenant; there is no way to pick a
 * platform role from this form.
 */
export const registerRestaurantSchema = z
  .object({
    restaurantName: nameSchema.min(2, 'Restaurant name must be at least 2 characters'),
    ownerName: nameSchema,
    email: emailSchema,
    phone: optionalPhoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    address: z
      .string()
      .trim()
      .max(255, 'Address must be at most 255 characters')
      .transform((value) => (value === '' ? null : value))
      .optional(),
    currency: z
      .string()
      .trim()
      .length(3, 'Use a three letter currency code, for example USD')
      .transform((value) => value.toUpperCase())
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterRestaurantBody = z.infer<typeof registerRestaurantSchema>;
