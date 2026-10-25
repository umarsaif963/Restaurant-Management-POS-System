import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as paymentController from '../controllers/payment.controller.js';
import { paymentParamsSchema, refundParamsSchema, recordPaymentSchema, refundPaymentSchema } from '../validators/payment.schema.js';

const router = Router();

router.use(authenticate());

router.get(
  '/:id/payments',
  requirePermission('PAYMENTS_CREATE'),
  validate({ params: paymentParamsSchema }),
  paymentController.listOrderPayments,
);
router.post(
  '/:id/payments',
  requirePermission('PAYMENTS_CREATE'),
  validate({ params: paymentParamsSchema, body: recordPaymentSchema }),
  paymentController.recordPayment,
);
router.post(
  '/:id/payments/:paymentId/refund',
  requirePermission('PAYMENTS_REFUND'),
  validate({ params: refundParamsSchema, body: refundPaymentSchema }),
  paymentController.refundPayment,
);

export default router;
