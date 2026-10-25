import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as customerController from '../controllers/customer.controller.js';
import {
  createCustomerSchema,
  listCustomersQuerySchema,
  resourceIdParamsSchema,
  updateCustomerSchema,
} from '../validators/customer.schema.js';

const router = Router();

// Customer data is front-of-house only; kitchen staff never needs it.
router.use(authenticate());
router.use(requirePermission('CUSTOMERS_READ'));

router.get('/', validate({ query: listCustomersQuerySchema }), customerController.listCustomers);
router.post(
  '/',
  requirePermission('CUSTOMERS_WRITE'),
  validate({ body: createCustomerSchema }),
  customerController.createCustomer,
);
router.get('/:id', validate({ params: resourceIdParamsSchema }), customerController.getCustomer);
router.patch(
  '/:id',
  requirePermission('CUSTOMERS_WRITE'),
  validate({ params: resourceIdParamsSchema, body: updateCustomerSchema }),
  customerController.updateCustomer,
);
router.delete(
  '/:id',
  requirePermission('CUSTOMERS_WRITE'),
  validate({ params: resourceIdParamsSchema }),
  customerController.deleteCustomer,
);

export default router;
