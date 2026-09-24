import { z } from 'zod';

/**
 * Analytics ranges accept ISO 8601 datetimes. Either bound may be omitted —
 * the service fills in sensible defaults (last 7 days for sales, last 30
 * days for the other reports).
 */
const optionalDateSchema = z
  .string()
  .datetime({ offset: true, message: 'Provide a valid ISO 8601 datetime for the range bound' })
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

export const analyticsRangeQuerySchema = refineRange(rangeSchema);

export const topItemsQuerySchema = refineRange(
  rangeSchema.extend({
    limit: z.coerce.number().int('Limit must be a whole number').min(1, 'Limit must be at least 1').max(50, 'Limit must be at most 50').default(10),
  }),
);