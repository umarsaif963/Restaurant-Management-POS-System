import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { RequestHandler } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { platformScope, requirePlatformAdmin } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as contactController from '../controllers/contact.controller.js';
import {
  contactMessageIdParamsSchema,
  listContactMessagesQuerySchema,
  submitContactMessageSchema,
  updateContactMessageSchema,
} from '../validators/contact.schema.js';

const router = Router();

const rateLimitHandler: RequestHandler = (_req, res) => {
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please try again later.',
  });
};

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
});

/** Public submission from the marketing site. */
router.post(
  '/contact',
  contactLimiter,
  validate({ body: submitContactMessageSchema }),
  contactController.submitMessage,
);

/** Platform-only inbox. */
router.use('/contact-messages', authenticate());
router.use('/contact-messages', requirePlatformAdmin());
router.use('/contact-messages', platformScope());

router.get(
  '/',
  validate({ query: listContactMessagesQuerySchema }),
  contactController.listMessages,
);

router.patch(
  '/:id',
  validate({ params: contactMessageIdParamsSchema, body: updateContactMessageSchema }),
  contactController.updateMessage,
);

export default router;
