import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import * as orderController from '../controllers/order.controller.js';
import {
  addOrderItemsSchema,
  createOrderSchema,
  listOrdersQuerySchema,
  orderItemParamsSchema,
  resourceIdParamsSchema,
  updateOrderSchema,
  updateOrderStatusSchema,
} from '../validators/order.schema.js';

const router = Router();

router.use(authenticate());

const frontOfHouse = [UserRole.WAITER, UserRole.CASHIER, UserRole.MANAGER, UserRole.ADMIN];

router.get('/', validate({ query: listOrdersQuerySchema }), orderController.listOrders);
router.get(
  '/:id',
  validate({ params: resourceIdParamsSchema }),
  orderController.getOrder,
);
router.get(
  '/:id/receipt',
  validate({ params: resourceIdParamsSchema }),
  orderController.getReceipt,
);
router.get(
  '/:id/inventory-movements',
  validate({ params: resourceIdParamsSchema }),
  orderController.getInventoryMovements,
);

router.post(
  '/',
  authorize(...frontOfHouse),
  validate({ body: createOrderSchema }),
  orderController.createOrder,
);
router.patch(
  '/:id',
  authorize(...frontOfHouse),
  validate({ params: resourceIdParamsSchema, body: updateOrderSchema }),
  orderController.updateOrder,
);
router.post(
  '/:id/items',
  authorize(...frontOfHouse),
  validate({ params: resourceIdParamsSchema, body: addOrderItemsSchema }),
  orderController.addItems,
);
router.delete(
  '/:id/items/:itemId',
  authorize(...frontOfHouse),
  validate({ params: orderItemParamsSchema }),
  orderController.removeItem,
);
router.post(
  '/:id/status',
  authorize(...frontOfHouse),
  validate({ params: resourceIdParamsSchema, body: updateOrderStatusSchema }),
  orderController.updateStatus,
);

export default router;