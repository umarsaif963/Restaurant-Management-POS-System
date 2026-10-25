import type { Request, Response } from 'express';
import type { RegisterRestaurantInput } from '@restaurant/shared';
import { SUBSCRIPTION_PLAN_CATALOG } from '@restaurant/shared';
import { signAccessToken } from '../utils/jwt.js';
import * as authService from '../services/auth.service.js';
import * as registrationService from '../services/registration.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { setAuthCookies } from '../utils/cookies.js';

/**
 * Public sign-up: creates a restaurant and its owner account.
 *
 * The account is signed in immediately so the new owner lands inside the
 * workspace instead of having to sign in again.
 */
export const registerRestaurant = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as RegisterRestaurantInput;
  const result = await registrationService.registerRestaurant(body);

  const { sessionId, refreshToken } = await authService.startSession(
    result.user.id,
    req.ip,
    req.get('user-agent')?.slice(0, 256),
  );

  const accessToken = signAccessToken({
    userId: result.user.id,
    role: result.user.role,
    sessionId,
  });

  setAuthCookies(res, accessToken, refreshToken);

  res.status(201).json({
    success: true,
    data: result,
    message: 'Your restaurant workspace is ready.',
  });
});

/**
 * The subscription tiers shown on the pricing page.
 */
export const listPlans = asyncHandler(async (_req: Request, res: Response) => {
  res.status(200).json({ success: true, data: { plans: SUBSCRIPTION_PLAN_CATALOG } });
});
