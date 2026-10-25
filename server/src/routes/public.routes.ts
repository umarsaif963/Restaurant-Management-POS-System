import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { validate } from '../middleware/validate.js';
import * as publicController from '../controllers/public.controller.js';
import * as contactController from '../controllers/contact.controller.js';
import { registerRestaurantSchema } from '../validators/registration.schema.js';
import { submitContactMessageSchema } from '../validators/contact.schema.js';

const router = Router();

const rateLimitHandler: RequestHandler = (_req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
  });
};

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/**
 * Endpoints that are reachable without an account. Everything else in the API
 * requires an authenticated, tenant-scoped session.
 */
router.get('/plans', publicController.listPlans);

router.post(
  '/register',
  registrationLimiter,
  validate({ body: registerRestaurantSchema }),
  publicController.registerRestaurant,
);

router.post(
  '/contact',
  contactLimiter,
  validate({ body: submitContactMessageSchema }),
  contactController.submitMessage,
);

export default router;
