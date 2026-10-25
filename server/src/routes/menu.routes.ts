import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
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

// ---- Categories ----------------------------------------------

router.get('/categories', requirePermission('MENU_READ'), menuController.listCategories);
router.post(
  '/categories',
  requirePermission('MENU_WRITE'),
  validate({ body: createMenuCategorySchema }),
  menuController.createCategory,
);
router.patch(
  '/categories/:id',
  requirePermission('MENU_WRITE'),
  validate({ params: resourceIdParamsSchema, body: updateMenuCategorySchema }),
  menuController.updateCategory,
);
router.delete(
  '/categories/:id',
  requirePermission('MENU_WRITE'),
  validate({ params: resourceIdParamsSchema }),
  menuController.deleteCategory,
);

// ---- Items, variations & add-ons -----------------------------

router.get(
  '/items',
  requirePermission('MENU_READ'),
  validate({ query: listMenuItemsQuerySchema }),
  menuController.listItems,
);
router.post(
  '/items',
  requirePermission('MENU_WRITE'),
  validate({ body: createMenuItemSchema }),
  menuController.createItem,
);
router.patch(
  '/items/:id',
  requirePermission('MENU_WRITE'),
  validate({ params: resourceIdParamsSchema, body: updateMenuItemSchema }),
  menuController.updateItem,
);
router.delete(
  '/items/:id',
  requirePermission('MENU_WRITE'),
  validate({ params: resourceIdParamsSchema }),
  menuController.deleteItem,
);

router.post(
  '/items/:itemId/variations',
  requirePermission('MENU_WRITE'),
  validate({ params: itemIdParamsSchema, body: createVariationSchema }),
  menuController.createVariation,
);
router.patch(
  '/variations/:id',
  requirePermission('MENU_WRITE'),
  validate({ params: resourceIdParamsSchema, body: updateVariationSchema }),
  menuController.updateVariation,
);
router.delete(
  '/variations/:id',
  requirePermission('MENU_WRITE'),
  validate({ params: resourceIdParamsSchema }),
  menuController.deleteVariation,
);

router.post(
  '/items/:itemId/addons',
  requirePermission('MENU_WRITE'),
  validate({ params: itemIdParamsSchema, body: createAddOnSchema }),
  menuController.createAddOn,
);
router.patch(
  '/addons/:id',
  requirePermission('MENU_WRITE'),
  validate({ params: resourceIdParamsSchema, body: updateAddOnSchema }),
  menuController.updateAddOn,
);
router.delete(
  '/addons/:id',
  requirePermission('MENU_WRITE'),
  validate({ params: resourceIdParamsSchema }),
  menuController.deleteAddOn,
);

export default router;
