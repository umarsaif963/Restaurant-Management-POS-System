import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as employeeController from '../controllers/employee.controller.js';
import {
  createEmployeeSchema,
  employeeIdParamsSchema,
  listEmployeesQuerySchema,
  updateEmployeeSchema,
} from '../validators/employee.schema.js';

const router = Router();

router.use(authenticate());

router.get(
  '/',
  requirePermission('EMPLOYEES_READ'),
  validate({ query: listEmployeesQuerySchema }),
  employeeController.listEmployees,
);

router.post(
  '/',
  requirePermission('EMPLOYEES_WRITE'),
  validate({ body: createEmployeeSchema }),
  employeeController.createEmployee,
);

router.get(
  '/:id',
  requirePermission('EMPLOYEES_READ'),
  validate({ params: employeeIdParamsSchema }),
  employeeController.getEmployee,
);

router.patch(
  '/:id',
  requirePermission('EMPLOYEES_WRITE'),
  validate({ params: employeeIdParamsSchema, body: updateEmployeeSchema }),
  employeeController.updateEmployee,
);

router.delete(
  '/:id',
  requirePermission('EMPLOYEES_WRITE'),
  validate({ params: employeeIdParamsSchema }),
  employeeController.deactivateEmployee,
);

router.post(
  '/:id/reactivate',
  requirePermission('EMPLOYEES_WRITE'),
  validate({ params: employeeIdParamsSchema }),
  employeeController.reactivateEmployee,
);

router.post(
  '/:id/reset-password',
  requirePermission('EMPLOYEES_WRITE'),
  validate({ params: employeeIdParamsSchema }),
  employeeController.resetEmployeePassword,
);

export default router;
