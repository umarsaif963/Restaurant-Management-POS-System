import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as roleController from '../controllers/role.controller.js';
import {
  createRoleSchema,
  listRolesQuerySchema,
  roleIdParamsSchema,
  updateRoleSchema,
} from '../validators/role.schema.js';

const router = Router();

router.use(authenticate());

router.get(
  '/',
  requirePermission('ROLES_READ'),
  validate({ query: listRolesQuerySchema }),
  roleController.listRoles,
);

router.post(
  '/',
  requirePermission('ROLES_WRITE'),
  validate({ body: createRoleSchema }),
  roleController.createRole,
);

router.get(
  '/:id',
  requirePermission('ROLES_READ'),
  validate({ params: roleIdParamsSchema }),
  roleController.getRole,
);

router.patch(
  '/:id',
  requirePermission('ROLES_WRITE'),
  validate({ params: roleIdParamsSchema, body: updateRoleSchema }),
  roleController.updateRole,
);

router.delete(
  '/:id',
  requirePermission('ROLES_WRITE'),
  validate({ params: roleIdParamsSchema }),
  roleController.deleteRole,
);

export default router;
