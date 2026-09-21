import { z } from 'zod';

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().min(1).default('/api'),
  VITE_SOCKET_URL: z.string().optional(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error(
    `Invalid client environment configuration: ${JSON.stringify(parsed.error.flatten().fieldErrors)}`,
  );
}

/**
 * Validated client environment object.
 */
export const env = Object.freeze(parsed.data);