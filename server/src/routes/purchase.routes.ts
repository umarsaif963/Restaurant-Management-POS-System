import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as purchaseController from '../controllers/purchase.controller.js';
import {
  changePurchaseStatusSchema,
  createPurchaseSchema,
  listPurchasesQuerySchema,
  purchaseParamsSchema,
  updatePurchaseSchema,
} from '../validators/purchase.schema.js';

const router = Router();

router.use(authenticate());

router.get(
  '/',
  requirePermission('PURCHASES_READ'),
  validate({ query: listPurchasesQuerySchema }),
  purchaseController.listPurchases,
);

router.get(
  '/:id',
  requirePermission('PURCHASES_READ'),
  validate({ params: purchaseParamsSchema }),
  purchaseController.getPurchase,
);

router.post(
  '/',
  requirePermission('PURCHASES_WRITE'),
  validate({ body: createPurchaseSchema }),
  purchaseController.createPurchase,
);

router.patch(
  '/:id',
  requirePermission('PURCHASES_WRITE'),
  validate({ params: purchaseParamsSchema, body: updatePurchaseSchema }),
  purchaseController.updatePurchase,
);

router.delete(
  '/:id',
  requirePermission('PURCHASES_WRITE'),
  validate({ params: purchaseParamsSchema }),
  purchaseController.deletePurchase,
);

router.post(
  '/:id/status',
  requirePermission('PURCHASES_WRITE'),
  validate({ params: purchaseParamsSchema, body: changePurchaseStatusSchema }),
  purchaseController.changePurchaseStatus,
);

export default router;
