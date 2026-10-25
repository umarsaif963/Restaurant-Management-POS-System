import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as tableController from '../controllers/table.controller.js';
import {
  createTableSchema,
  createTableSectionSchema,
  listTablesQuerySchema,
  resourceIdParamsSchema,
  updateTableSchema,
  updateTableSectionSchema,
} from '../validators/table.schema.js';

const router = Router();

router.use(authenticate());

// Sections must be declared before the `/:id` table routes.
router.get('/sections', requirePermission('TABLES_READ'), tableController.listSections);
router.post(
  '/sections',
  requirePermission('TABLES_WRITE'),
  validate({ body: createTableSectionSchema }),
  tableController.createSection,
);
router.patch(
  '/sections/:id',
  requirePermission('TABLES_WRITE'),
  validate({ params: resourceIdParamsSchema, body: updateTableSectionSchema }),
  tableController.updateSection,
);
router.delete(
  '/sections/:id',
  requirePermission('TABLES_WRITE'),
  validate({ params: resourceIdParamsSchema }),
  tableController.deleteSection,
);

router.get(
  '/',
  requirePermission('TABLES_READ'),
  validate({ query: listTablesQuerySchema }),
  tableController.listTables,
);
router.post(
  '/',
  requirePermission('TABLES_WRITE'),
  validate({ body: createTableSchema }),
  tableController.createTable,
);
router.patch(
  '/:id',
  requirePermission('TABLES_WRITE'),
  validate({ params: resourceIdParamsSchema, body: updateTableSchema }),
  tableController.updateTable,
);
router.delete(
  '/:id',
  requirePermission('TABLES_WRITE'),
  validate({ params: resourceIdParamsSchema }),
  tableController.deleteTable,
);

export default router;
