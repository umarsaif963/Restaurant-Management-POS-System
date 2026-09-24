import { z } from 'zod';

/**
 * Audit log listing and retention (module 14). Ranges accept ISO 8601
 * datetimes and must respect `from <= to`.
 */
const AUDIT_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

const optionalDateSchema = z
  .string()
  .datetime({ offset: true, message: 'Provide a valid ISO 8601 datetime for the bound' })
  .optional();

const rangeSchema = z.object({
  from: optionalDateSchema,
  to: optionalDateSchema,
});

const refineRange = (schema: typeof rangeSchema) =>
  schema.refine(
    (data) => !data.from || !data.to || new Date(data.from).getTime() <= new Date(data.to).getTime(),
    { message: "'from' must be earlier than or equal to 'to'", path: ['from'] },
  );

export const listAuditLogsQuerySchema = refineRange(
  rangeSchema.extend({
    page: z.coerce.number().int('Page must be a whole number').min(1, 'Page must be at least 1').default(1),
    limit: z.coerce
      .number()
      .int('Limit must be a whole number')
      .min(1, 'Limit must be at least 1')
      .max(100, 'Limit must be at most 100')
      .default(20),
    search: z.string().trim().max(200, 'Search is too long').optional(),
    entity: z.string().trim().max(60, 'Entity is too long').optional(),
    method: z.enum(AUDIT_METHODS).optional(),
    status: z.coerce
      .number()
      .int('Status must be a whole number')
      .min(100, 'Status must be at least 100')
      .max(599, 'Status must be at most 599')
      .optional(),
    sort: z.enum(['asc', 'desc']).default('desc'),
  }),
);

export const purgeAuditLogsSchema = z.object({
  olderThanDays: z.coerce
    .number()
    .int('Days must be a whole number')
    .min(1, 'Days must span at least 1 day')
    .max(365, 'Days must span at most 365 days'),
});