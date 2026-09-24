import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import {
  orderBreakdown,
  paymentMethods,
  salesByDay,
  topItems,
} from '../controllers/analytics.controller.js';
import { analyticsRangeQuerySchema, topItemsQuerySchema } from '../validators/analytics.schema.js';

const router = Router();

router.use(authenticate());
router.use(authorize(UserRole.MANAGER, UserRole.ADMIN));

router.get('/sales', validate({ query: analyticsRangeQuerySchema }), salesByDay);
router.get('/top-items', validate({ query: topItemsQuerySchema }), topItems);
router.get('/payment-methods', validate({ query: analyticsRangeQuerySchema }), paymentMethods);
router.get('/orders', validate({ query: analyticsRangeQuerySchema }), orderBreakdown);

export default router;