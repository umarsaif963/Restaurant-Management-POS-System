import { env } from './env.js';

/**
 * Shared authentication constants (module 3).
 * Cookie names, expiry windows and JWT configuration used by the auth service,
 * middleware and cookie helpers.
 */

const UNIT_PATTERN = /^(\d+)\s*(ms|s|m|h|d|w)$/;

/**
 * Convert a JWT-style duration string ("15m", "7d", "90s") to milliseconds.
 */
export function ms(duration: string): number {
  const match = UNIT_PATTERN.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration string: "${duration}"`);
  }
  const value = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
  };
  return value * multipliers[unit];
}

export const COOKIE_NAMES = {
  ACCESS: 'access_token',
  REFRESH: 'refresh_token',
} as const;

/**
 * Milliseconds until a refresh-token session expires. Mirrors
 * `env.JWT_REFRESH_EXPIRES_IN` but as a number for `Session.expiresAt`.
 */
export const REFRESH_SESSION_TTL_MS = ms(env.JWT_REFRESH_EXPIRES_IN);

export const ACCESS_TOKEN_TTL_MS = ms(env.JWT_ACCESS_EXPIRES_IN);

export const PASSWORD_RESET_TTL_MS = ms(env.PASSWORD_RESET_EXPIRES_IN);

/**
 * Whether cookies must be marked `Secure`. Always true outside development so
 * tokens never travel over plain HTTP.
 */
export const COOKIE_SECURE = env.NODE_ENV !== 'development';

/**
 * `SameSite` policy for the auth cookies.
 *
 * Development serves the client and the API from the same site, so `lax` is
 * preferred. In production the client (Vercel) and the API (Bonto) are
 * different sites, so the browser will not attach a `lax` cookie to the
 * client's cross-site XHRs and every request after login would be 401.
 * `none` is required there, and browsers only honour `none` over HTTPS, which
 * is already guaranteed by `COOKIE_SECURE`.
 */
export const COOKIE_SAME_SITE = env.NODE_ENV === 'development' ? 'lax' : 'none';

/**
 * Restrict the refresh cookie to the auth API namespace so it is never
 * forwarded to unrelated endpoints (defense in depth).
 */
export const REFRESH_COOKIE_PATH = '/api/v1/auth';