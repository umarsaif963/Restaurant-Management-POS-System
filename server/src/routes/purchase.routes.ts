import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
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

const managers = [UserRole.MANAGER, UserRole.ADMIN];

router.get(
  '/',
  validate({ query: listPurchasesQuerySchema }),
  purchaseController.listPurchases,
);

router.get(
  '/:id',
  validate({ params: purchaseParamsSchema }),
  purchaseController.getPurchase,
);

router.post(
  '/',
  authorize(...managers),
  validate({ body: createPurchaseSchema }),
  purchaseController.createPurchase,
);

router.patch(
  '/:id',
  authorize(...managers),
  validate({ params: purchaseParamsSchema, body: updatePurchaseSchema }),
  purchaseController.updatePurchase,
);

router.delete(
  '/:id',
  authorize(...managers),
  validate({ params: purchaseParamsSchema }),
  purchaseController.deletePurchase,
);

router.post(
  '/:id/status',
  authorize(...managers),
  validate({ params: purchaseParamsSchema, body: changePurchaseStatusSchema }),
  purchaseController.changePurchaseStatus,
);

export default router;