import { createHash, randomBytes } from 'node:crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type { UserRole } from '@prisma/client';
import { env } from '../config/env.js';
import { ApiError } from './ApiError.js';

const ISSUER = 'restaurant-pos';
const AUDIENCE = 'restaurant-pos';
const TOKEN_TYPE = 'access';

export interface AccessTokenPayload {
  sessionId: string;
  role: UserRole;
}

export interface VerifiedAccessToken {
  userId: string;
  role: UserRole;
  sessionId: string;
}

/**
 * Sign a short-lived access JWT. The refresh token itself is an opaque random
 * string stored (hashed) in the database, so no secret needs to be embedded
 * in it.
 */
export function signAccessToken(params: AccessTokenPayload & { userId: string }): string {
  return jwt.sign(
    { sessionId: params.sessionId, role: params.role, type: TOKEN_TYPE },
    env.JWT_SECRET,
    {
      subject: params.userId,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
      issuer: ISSUER,
      audience: AUDIENCE,
    },
  );
}

/**
 * Verify an access token and return its claims. Any signature/tampering issue
 * is normalised to a generic 401 so the client cannot distinguish reasons.
 */
export function verifyAccessToken(token: string): VerifiedAccessToken {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (
      typeof payload === 'string' ||
      payload.type !== TOKEN_TYPE ||
      typeof payload.sub !== 'string' ||
      typeof payload.role !== 'string' ||
      typeof payload.sessionId !== 'string'
    ) {
      throw new Error('Unexpected access token payload shape');
    }
    return {
      userId: payload.sub,
      role: payload.role as UserRole,
      sessionId: payload.sessionId,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw ApiError.unauthorized('Invalid or expired session token');
  }
}

/**
 * Generate a cryptographically random opaque token (refreshes, password resets).
 */
export function generateRandomToken(bytes = 48): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Generate a refresh token.
 */
export function generateRefreshToken(): string {
  return generateRandomToken();
}

/**
 * SHA-256 hash of a raw token. Only the hash is persisted so a leaked database
 * dump cannot be used to mint sessions or reset passwords.
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}