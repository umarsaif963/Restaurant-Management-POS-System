import type { Response } from 'express';
import {
  ACCESS_TOKEN_TTL_MS,
  COOKIE_NAMES,
  COOKIE_SECURE,
  REFRESH_COOKIE_PATH,
  REFRESH_SESSION_TTL_MS,
} from '../config/auth.js';

/**
 * HTTP-only cookies carrying the auth tokens (module 3).
 *
 * The refresh cookie is scoped to the auth API namespace so browsers only ever
 * attach it to `/api/v1/auth/*` requests, limiting replay surface.
 */

function cookieBase(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax';
  path: string;
} {
  return {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: 'lax',
    path: '/',
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie(COOKIE_NAMES.ACCESS, accessToken, {
    ...cookieBase(),
    maxAge: ACCESS_TOKEN_TTL_MS,
  });
  res.cookie(COOKIE_NAMES.REFRESH, refreshToken, {
    ...cookieBase(),
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_SESSION_TTL_MS,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(COOKIE_NAMES.ACCESS, { httpOnly: true, sameSite: 'lax', secure: COOKIE_SECURE, path: '/' });
  res.clearCookie(COOKIE_NAMES.REFRESH, {
    httpOnly: true,
    sameSite: 'lax',
    secure: COOKIE_SECURE,
    path: REFRESH_COOKIE_PATH,
  });
}