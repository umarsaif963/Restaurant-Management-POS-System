import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import * as inventoryController from '../controllers/inventory.controller.js';
import {
  createInventoryItemSchema,
  listInventoryItemsQuerySchema,
  listInventoryTransactionsQuerySchema,
  recordTransactionSchema,
  resourceIdParamsSchema,
  updateInventoryItemSchema,
} from '../validators/inventory.schema.js';

const router = Router();

router.use(authenticate());

// Inventory is book-keeping: managers/admin read and mutate stock. Kitchen and
// front-of-house staff can view items but not adjust balances.
const managers = [UserRole.MANAGER, UserRole.ADMIN];

router.get('/items', validate({ query: listInventoryItemsQuerySchema }), inventoryController.listItems);

router.get(
  '/items/:id',
  validate({ params: resourceIdParamsSchema }),
  inventoryController.getItem,
);

router.post(
  '/items',
  authorize(...managers),
  validate({ body: createInventoryItemSchema }),
  inventoryController.createItem,
);

router.patch(
  '/items/:id',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema, body: updateInventoryItemSchema }),
  inventoryController.updateItem,
);

router.delete(
  '/items/:id',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema }),
  inventoryController.deleteItem,
);

router.get(
  '/transactions',
  validate({ query: listInventoryTransactionsQuerySchema }),
  inventoryController.listTransactions,
);

router.post(
  '/items/:id/transactions',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema, body: recordTransactionSchema }),
  inventoryController.recordTransaction,
);

export default router;