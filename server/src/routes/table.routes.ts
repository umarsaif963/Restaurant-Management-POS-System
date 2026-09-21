import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
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
router.get('/sections', tableController.listSections);
router.post(
  '/sections',
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  validate({ body: createTableSectionSchema }),
  tableController.createSection,
);
router.patch(
  '/sections/:id',
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  validate({ params: resourceIdParamsSchema, body: updateTableSectionSchema }),
  tableController.updateSection,
);
router.delete(
  '/sections/:id',
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  validate({ params: resourceIdParamsSchema }),
  tableController.deleteSection,
);

router.get('/', validate({ query: listTablesQuerySchema }), tableController.listTables);
router.post(
  '/',
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  validate({ body: createTableSchema }),
  tableController.createTable,
);
router.patch(
  '/:id',
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  validate({ params: resourceIdParamsSchema, body: updateTableSchema }),
  tableController.updateTable,
);
router.delete(
  '/:id',
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  validate({ params: resourceIdParamsSchema }),
  tableController.deleteTable,
);

export default router;