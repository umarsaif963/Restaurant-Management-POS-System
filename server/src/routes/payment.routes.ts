import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import * as paymentController from '../controllers/payment.controller.js';
import { paymentParamsSchema, refundParamsSchema, recordPaymentSchema, refundPaymentSchema } from '../validators/payment.schema.js';

const router = Router();

router.use(authenticate());

const frontOfHouse = [UserRole.WAITER, UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN];
// Refunds are sensitive: only management-grade accounts may reverse a payment.
const refunders = [UserRole.MANAGER, UserRole.ADMIN];

router.get(
  '/:id/payments',
  validate({ params: paymentParamsSchema }),
  paymentController.listOrderPayments,
);
router.post(
  '/:id/payments',
  authorize(...frontOfHouse),
  validate({ params: paymentParamsSchema, body: recordPaymentSchema }),
  paymentController.recordPayment,
);
router.post(
  '/:id/payments/:paymentId/refund',
  authorize(...refunders),
  validate({ params: refundParamsSchema, body: refundPaymentSchema }),
  paymentController.refundPayment,
);

export default router;