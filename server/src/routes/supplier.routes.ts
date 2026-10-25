import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as supplierController from '../controllers/supplier.controller.js';
import {
  createSupplierSchema,
  listSuppliersQuerySchema,
  supplierParamsSchema,
  updateSupplierSchema,
} from '../validators/supplier.schema.js';

const router = Router();

router.use(authenticate());

router.get(
  '/',
  requirePermission('SUPPLIERS_READ'),
  validate({ query: listSuppliersQuerySchema }),
  supplierController.listSuppliers,
);

router.get(
  '/:id',
  requirePermission('SUPPLIERS_READ'),
  validate({ params: supplierParamsSchema }),
  supplierController.getSupplier,
);

router.post(
  '/',
  requirePermission('SUPPLIERS_WRITE'),
  validate({ body: createSupplierSchema }),
  supplierController.createSupplier,
);

router.patch(
  '/:id',
  requirePermission('SUPPLIERS_WRITE'),
  validate({ params: supplierParamsSchema, body: updateSupplierSchema }),
  supplierController.updateSupplier,
);

router.delete(
  '/:id',
  requirePermission('SUPPLIERS_WRITE'),
  validate({ params: supplierParamsSchema }),
  supplierController.deleteSupplier,
);

export default router;
