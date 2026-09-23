import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
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

const managers = [UserRole.MANAGER, UserRole.ADMIN];

router.get(
  '/',
  validate({ query: listSuppliersQuerySchema }),
  supplierController.listSuppliers,
);

router.get(
  '/:id',
  validate({ params: supplierParamsSchema }),
  supplierController.getSupplier,
);

router.post(
  '/',
  authorize(...managers),
  validate({ body: createSupplierSchema }),
  supplierController.createSupplier,
);

router.patch(
  '/:id',
  authorize(...managers),
  validate({ params: supplierParamsSchema, body: updateSupplierSchema }),
  supplierController.updateSupplier,
);

router.delete(
  '/:id',
  authorize(...managers),
  validate({ params: supplierParamsSchema }),
  supplierController.deleteSupplier,
);

export default router;