import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
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
router.use(authorize(UserRole.MANAGER, UserRole.ADMIN, UserRole.CASHIER, UserRole.WAITER));

router.get('/', validate({ query: listCustomersQuerySchema }), customerController.listCustomers);
router.post('/', validate({ body: createCustomerSchema }), customerController.createCustomer);
router.get('/:id', validate({ params: resourceIdParamsSchema }), customerController.getCustomer);
router.patch(
  '/:id',
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  validate({ params: resourceIdParamsSchema, body: updateCustomerSchema }),
  customerController.updateCustomer,
);
router.delete(
  '/:id',
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  validate({ params: resourceIdParamsSchema }),
  customerController.deleteCustomer,
);

export default router;