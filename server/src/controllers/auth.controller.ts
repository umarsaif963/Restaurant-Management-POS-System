import type { Request, Response } from 'express';
import type {
  ChangePasswordInput,
  CreateUserInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from '@restaurant/shared';
import { COOKIE_NAMES } from '../config/auth.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { clearAuthCookies, setAuthCookies } from '../utils/cookies.js';

function getClientMeta(req: Request): { ip?: string; userAgent?: string } {
  return {
    ip: req.ip,
    userAgent: req.get('user-agent')?.slice(0, 256),
  };
}

/**
 * Staff creation (manager- and admin-only). Shares the same rules as
 * `POST /users`.
 */
export const register = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateUserInput;
  const user = await userService.createUser({
    ...body,
    actorRole: req.authenticated!.role,
  });
  res.status(201).json({ success: true, data: { user } });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as LoginInput;
  const result = await authService.login({ ...body, ...getClientMeta(req) });
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(200).json({ success: true, data: { user: result.user } });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH] as string | undefined;
  const result = await authService.refreshSession({ refreshToken, ...getClientMeta(req) });
  setAuthCookies(res, result.accessToken, result.refreshToken);
  res.status(200).json({ success: true, data: { user: result.user } });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.[COOKIE_NAMES.REFRESH] as string | undefined;
  await authService.logout({ refreshToken });
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully' });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getAuthUser(req.authenticated!.userId);
  res.status(200).json({ success: true, data: { user } });
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as ChangePasswordInput;
  await authService.changePassword({
    userId: req.authenticated!.userId,
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
    keepSessionId: req.authenticated!.sessionId,
  });
  res.status(200).json({ success: true, message: 'Password changed successfully' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as ForgotPasswordInput;
  await authService.forgotPassword({ email: body.email });
  res.status(200).json({
    success: true,
    message: 'If an account exists for that email, a password reset link has been sent.',
  });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as ResetPasswordInput;
  await authService.resetPassword({ token: body.token, newPassword: body.newPassword });
  res.status(200).json({
    success: true,
    message: 'Password has been reset. You can now log in.',
  });
});