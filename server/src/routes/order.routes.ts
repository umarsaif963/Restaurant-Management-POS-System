import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
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

router.get(
  '/',
  requirePermission('ORDERS_READ'),
  validate({ query: listOrdersQuerySchema }),
  orderController.listOrders,
);
router.get(
  '/:id',
  requirePermission('ORDERS_READ'),
  validate({ params: resourceIdParamsSchema }),
  orderController.getOrder,
);
router.get(
  '/:id/receipt',
  requirePermission('RECEIPTS_PRINT'),
  validate({ params: resourceIdParamsSchema }),
  orderController.getReceipt,
);
router.get(
  '/:id/inventory-movements',
  requirePermission('ORDERS_READ'),
  validate({ params: resourceIdParamsSchema }),
  orderController.getInventoryMovements,
);

router.post(
  '/',
  requirePermission('ORDERS_CREATE'),
  validate({ body: createOrderSchema }),
  orderController.createOrder,
);
router.patch(
  '/:id',
  requirePermission('ORDERS_UPDATE'),
  validate({ params: resourceIdParamsSchema, body: updateOrderSchema }),
  orderController.updateOrder,
);
router.post(
  '/:id/items',
  requirePermission('ORDERS_UPDATE'),
  validate({ params: resourceIdParamsSchema, body: addOrderItemsSchema }),
  orderController.addItems,
);
router.delete(
  '/:id/items/:itemId',
  requirePermission('ORDERS_UPDATE'),
  validate({ params: orderItemParamsSchema }),
  orderController.removeItem,
);
router.post(
  '/:id/status',
  requirePermission('ORDERS_UPDATE'),
  validate({ params: resourceIdParamsSchema, body: updateOrderStatusSchema }),
  orderController.updateStatus,
);

export default router;
