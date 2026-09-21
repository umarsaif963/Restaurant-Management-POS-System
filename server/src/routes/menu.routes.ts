import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import * as menuController from '../controllers/menu.controller.js';
import {
  createAddOnSchema,
  createMenuCategorySchema,
  createMenuItemSchema,
  createVariationSchema,
  itemIdParamsSchema,
  listMenuItemsQuerySchema,
  resourceIdParamsSchema,
  updateAddOnSchema,
  updateMenuCategorySchema,
  updateMenuItemSchema,
  updateVariationSchema,
} from '../validators/menu.schema.js';

const router = Router();

router.use(authenticate());

const managers = [UserRole.MANAGER, UserRole.ADMIN];

// ---- Categories ----------------------------------------------

router.get('/categories', menuController.listCategories);
router.post(
  '/categories',
  authorize(...managers),
  validate({ body: createMenuCategorySchema }),
  menuController.createCategory,
);
router.patch(
  '/categories/:id',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema, body: updateMenuCategorySchema }),
  menuController.updateCategory,
);
router.delete(
  '/categories/:id',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema }),
  menuController.deleteCategory,
);

// ---- Items, variations & add-ons -----------------------------

router.get('/items', validate({ query: listMenuItemsQuerySchema }), menuController.listItems);
router.post(
  '/items',
  authorize(...managers),
  validate({ body: createMenuItemSchema }),
  menuController.createItem,
);
router.patch(
  '/items/:id',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema, body: updateMenuItemSchema }),
  menuController.updateItem,
);
router.delete(
  '/items/:id',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema }),
  menuController.deleteItem,
);

router.post(
  '/items/:itemId/variations',
  authorize(...managers),
  validate({ params: itemIdParamsSchema, body: createVariationSchema }),
  menuController.createVariation,
);
router.patch(
  '/variations/:id',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema, body: updateVariationSchema }),
  menuController.updateVariation,
);
router.delete(
  '/variations/:id',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema }),
  menuController.deleteVariation,
);

router.post(
  '/items/:itemId/addons',
  authorize(...managers),
  validate({ params: itemIdParamsSchema, body: createAddOnSchema }),
  menuController.createAddOn,
);
router.patch(
  '/addons/:id',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema, body: updateAddOnSchema }),
  menuController.updateAddOn,
);
router.delete(
  '/addons/:id',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema }),
  menuController.deleteAddOn,
);

export default router;