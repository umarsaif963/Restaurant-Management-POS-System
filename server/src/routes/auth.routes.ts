import { Router, type RequestHandler } from 'express';
import rateLimit from 'express-rate-limit';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import * as authController from '../controllers/auth.controller.js';
import * as authSchemas from '../validators/auth.schema.js';
import { createUserSchema } from '../validators/user.schema.js';

const router = Router();

const rateLimitHandler: RequestHandler = (_req, res) => {
  res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
};

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

router.post(
  '/login',
  loginLimiter,
  validate({ body: authSchemas.loginSchema }),
  authController.login,
);

router.post('/refresh', authController.refresh);

router.post('/logout', authController.logout);

router.get('/me', authenticate(), authController.me);

router.post(
  '/change-password',
  authenticate(),
  validate({ body: authSchemas.changePasswordSchema }),
  authController.changePassword,
);

router.post(
  '/register',
  authenticate(),
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  validate({ body: createUserSchema }),
  authController.register,
);

router.post(
  '/forgot-password',
  forgotLimiter,
  validate({ body: authSchemas.forgotPasswordSchema }),
  authController.forgotPassword,
);

router.post(
  '/reset-password',
  resetLimiter,
  validate({ body: authSchemas.resetPasswordSchema }),
  authController.resetPassword,
);

export default router;