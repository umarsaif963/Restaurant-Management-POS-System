import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as kitchenController from '../controllers/kitchen.controller.js';
import {
  listKitchenOrdersQuerySchema,
  resourceIdParamsSchema,
  updateKitchenOrderStatusSchema,
} from '../validators/kitchen.schema.js';

const router = Router();

router.use(authenticate());

router.get(
  '/',
  requirePermission('KITCHEN_READ'),
  validate({ query: listKitchenOrdersQuerySchema }),
  kitchenController.listKitchenOrders,
);
router.get(
  '/:id',
  requirePermission('KITCHEN_READ'),
  validate({ params: resourceIdParamsSchema }),
  kitchenController.getKitchenOrder,
);
router.post(
  '/:id/status',
  requirePermission('KITCHEN_UPDATE'),
  validate({ params: resourceIdParamsSchema, body: updateKitchenOrderStatusSchema }),
  kitchenController.updateKitchenStatus,
);

export default router;
