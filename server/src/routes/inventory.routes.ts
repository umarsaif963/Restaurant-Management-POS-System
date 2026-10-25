import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as inventoryController from '../controllers/inventory.controller.js';
import {
  createInventoryItemSchema,
  listInventoryItemsQuerySchema,
  listInventoryTransactionsQuerySchema,
  recordTransactionSchema,
  reorderSuggestionsQuerySchema,
  resourceIdParamsSchema,
  updateInventoryItemSchema,
} from '../validators/inventory.schema.js';

const router = Router();

router.use(authenticate());

// Inventory is book-keeping: managers/admin read and mutate stock. Kitchen and
// front-of-house staff can view items but not adjust balances.
router.get(
  '/items',
  requirePermission('INVENTORY_READ'),
  validate({ query: listInventoryItemsQuerySchema }),
  inventoryController.listItems,
);

router.get(
  '/reorder-suggestions',
  requirePermission('INVENTORY_READ'),
  validate({ query: reorderSuggestionsQuerySchema }),
  inventoryController.getReorderSuggestions,
);

router.get(
  '/items/:id',
  requirePermission('INVENTORY_READ'),
  validate({ params: resourceIdParamsSchema }),
  inventoryController.getItem,
);

router.post(
  '/items',
  requirePermission('INVENTORY_WRITE'),
  validate({ body: createInventoryItemSchema }),
  inventoryController.createItem,
);

router.patch(
  '/items/:id',
  requirePermission('INVENTORY_WRITE'),
  validate({ params: resourceIdParamsSchema, body: updateInventoryItemSchema }),
  inventoryController.updateItem,
);

router.delete(
  '/items/:id',
  requirePermission('INVENTORY_WRITE'),
  validate({ params: resourceIdParamsSchema }),
  inventoryController.deleteItem,
);

router.get(
  '/transactions',
  requirePermission('INVENTORY_READ'),
  validate({ query: listInventoryTransactionsQuerySchema }),
  inventoryController.listTransactions,
);

router.post(
  '/items/:id/transactions',
  requirePermission('INVENTORY_TRANSACT'),
  validate({ params: resourceIdParamsSchema, body: recordTransactionSchema }),
  inventoryController.recordTransaction,
);

export default router;
