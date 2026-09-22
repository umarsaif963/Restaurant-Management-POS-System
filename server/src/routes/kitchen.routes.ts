import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import * as kitchenController from '../controllers/kitchen.controller.js';
import {
  listKitchenOrdersQuerySchema,
  resourceIdParamsSchema,
  updateKitchenOrderStatusSchema,
} from '../validators/kitchen.schema.js';

const router = Router();

router.use(authenticate());

const kitchenStaff = [UserRole.KITCHEN_STAFF, UserRole.MANAGER, UserRole.ADMIN];

router.get(
  '/',
  validate({ query: listKitchenOrdersQuerySchema }),
  kitchenController.listKitchenOrders,
);
router.get(
  '/:id',
  validate({ params: resourceIdParamsSchema }),
  kitchenController.getKitchenOrder,
);
router.post(
  '/:id/status',
  authorize(...kitchenStaff),
  validate({ params: resourceIdParamsSchema, body: updateKitchenOrderStatusSchema }),
  kitchenController.updateKitchenStatus,
);

export default router;