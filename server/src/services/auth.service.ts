import type { AuthUser } from '@restaurant/shared';
import { prisma } from '../config/prisma.js';
import { PASSWORD_RESET_TTL_MS, REFRESH_SESSION_TTL_MS } from '../config/auth.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';
import {
  generateRandomToken,
  generateRefreshToken,
  hashToken,
  signAccessToken,
} from '../utils/jwt.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { sendEmail } from '../utils/mailer.js';
import { toAuthUser, userAuthSelect, type UserRow } from './user.mapper.js';

export interface LoginParams {
  email: string;
  password: string;
  ip?: string;
  userAgent?: string;
}

export interface SessionResult {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

async function createSession(
  userId: string,
  ip?: string,
  userAgent?: string,
): Promise<{ sessionId: string; refreshToken: string }> {
  const refreshToken = generateRefreshToken();
  const session = await prisma.session.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      ip,
      userAgent,
      expiresAt: new Date(Date.now() + REFRESH_SESSION_TTL_MS),
    },
  });
  return { sessionId: session.id, refreshToken };
}

async function fetchUserRow(userId: string): Promise<UserRow> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userAuthSelect,
  });
  if (!user) {
    throw ApiError.unauthorized('Session is no longer valid');
  }
  return user;
}

export async function login(params: LoginParams): Promise<SessionResult> {
  const account = await prisma.user.findUnique({
    where: { email: params.email },
    select: { id: true, password: true, status: true, role: true },
  });

  // Generic failure keeps account existence and status from being enumerated.
  if (
    !account ||
    account.status !== 'ACTIVE' ||
    !(await verifyPassword(params.password, account.password))
  ) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const { sessionId, refreshToken } = await createSession(
    account.id,
    params.ip,
    params.userAgent,
  );

  await prisma.user.update({ where: { id: account.id }, data: { lastLoginAt: new Date() } });

  const user = await fetchUserRow(account.id);
  const accessToken = signAccessToken({
    userId: account.id,
    role: account.role,
    sessionId,
  });

  return { user: toAuthUser(user), accessToken, refreshToken };
}

export async function refreshSession(params: {
  refreshToken?: string;
  ip?: string;
  userAgent?: string;
}): Promise<SessionResult> {
  if (!params.refreshToken) {
    throw ApiError.unauthorized('Invalid refresh token');
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(params.refreshToken) },
    include: { user: { select: userAuthSelect } },
  });

  if (
    !session ||
    session.revokedAt !== null ||
    session.expiresAt.getTime() <= Date.now() ||
    session.user.status !== 'ACTIVE'
  ) {
    throw ApiError.unauthorized('Session expired or revoked');
  }

  const now = new Date();
  const newRefreshToken = generateRefreshToken();

  // Rotate: revoke the presented session and mint a fresh token/session pair.
  const [, created] = await prisma.$transaction([
    prisma.session.update({
      where: { id: session.id },
      data: { revokedAt: now, lastUsedAt: now },
    }),
    prisma.session.create({
      data: {
        userId: session.userId,
        tokenHash: hashToken(newRefreshToken),
        ip: params.ip,
        userAgent: params.userAgent,
        expiresAt: new Date(now.getTime() + REFRESH_SESSION_TTL_MS),
      },
    }),
  ]);

  const accessToken = signAccessToken({
    userId: session.userId,
    role: session.user.role,
    sessionId: created.id,
  });

  return {
    user: toAuthUser(session.user),
    accessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logout(params: { refreshToken?: string }): Promise<void> {
  if (!params.refreshToken) {
    return;
  }
  await prisma.session.updateMany({
    where: { tokenHash: hashToken(params.refreshToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getAuthUser(userId: string): Promise<AuthUser> {
  const user = await prisma.user.findFirst({
    where: { id: userId, status: 'ACTIVE' },
    select: userAuthSelect,
  });
  if (!user) {
    throw ApiError.unauthorized('Session is no longer valid');
  }
  return toAuthUser(user);
}

export async function changePassword(params: {
  userId: string;
  currentPassword: string;
  newPassword: string;
  keepSessionId?: string;
}): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { password: true },
  });
  if (!user || !(await verifyPassword(params.currentPassword, user.password))) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  const newHash = await hashPassword(params.newPassword);
  await prisma.$transaction([
    prisma.user.update({ where: { id: params.userId }, data: { password: newHash } }),
    prisma.session.updateMany({
      where: {
        userId: params.userId,
        revokedAt: null,
        ...(params.keepSessionId ? { NOT: { id: params.keepSessionId } } : {}),
      },
      data: { revokedAt: new Date() },
    }),
  ]);
}

/**
 * Requests a password-reset email. Always resolves successfully regardless of
 * whether the email exists, preventing account enumeration. In development
 * (no SMTP) the reset link is logged to the server console.
 */
export async function forgotPassword(params: { email: string }): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { email: params.email },
    select: { id: true, name: true, email: true },
  });
  if (!user) {
    return;
  }

  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  const token = generateRandomToken(32);
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS),
    },
  });

  const resetLink = `${env.CLIENT_URL}/reset-password?token=${encodeURIComponent(token)}`;
  const validityMinutes = Math.round(PASSWORD_RESET_TTL_MS / 60_000);

  await sendEmail({
    to: user.email,
    subject: 'Reset your password',
    text: `Hello ${user.name},\n\nYou requested a password reset for your account. Use the link below to choose a new password (valid for ${validityMinutes} minutes):\n\n${resetLink}\n\nIf you did not request this, you can safely ignore this email.`,
    html: `<p>Hello ${escapeHtml(user.name)},</p><p>You requested a password reset for your account. Click the link below to choose a new password (valid for ${validityMinutes} minutes):</p><p><a href="${resetLink}">${resetLink}</a></p><p>If you did not request this, you can safely ignore this email.</p>`,
  });
}

export async function resetPassword(params: {
  token: string;
  newPassword: string;
}): Promise<void> {
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash: hashToken(params.token), usedAt: null },
    select: { id: true, userId: true, expiresAt: true },
  });

  if (!record || record.expiresAt.getTime() <= Date.now()) {
    throw ApiError.badRequest('Reset token is invalid or has expired');
  }

  const newHash = await hashPassword(params.newPassword);
  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({ where: { id: record.userId }, data: { password: newHash } }),
    prisma.session.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    }),
  ]);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return entities[char] ?? char;
  });
}