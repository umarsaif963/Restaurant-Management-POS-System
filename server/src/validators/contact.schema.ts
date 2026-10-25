import { z } from 'zod';
import { CONTACT_MESSAGE_STATUSES } from '@restaurant/shared';
import { emailSchema, idSchema, nameSchema } from './common.js';

/**
 * Message from the public contact form. Length limits keep a single request
 * from being used to store an unbounded payload.
 */
export const submitContactMessageSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  company: z
    .string()
    .trim()
    .max(120, 'Company must be at most 120 characters')
    .transform((value) => (value === '' ? null : value))
    .optional(),
  message: z
    .string()
    .trim()
    .min(10, 'Message must be at least 10 characters')
    .max(2_000, 'Message must be at most 2000 characters'),
});

export const contactMessageIdParamsSchema = z.object({
  id: idSchema,
});

export const listContactMessagesQuerySchema = z.object({
  status: z.enum(CONTACT_MESSAGE_STATUSES).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const updateContactMessageSchema = z.object({
  status: z.enum(CONTACT_MESSAGE_STATUSES),
});
