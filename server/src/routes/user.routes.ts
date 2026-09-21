import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import * as userController from '../controllers/user.controller.js';
import {
  createUserSchema,
  listUsersQuerySchema,
  updateUserSchema,
  userIdParamsSchema,
} from '../validators/user.schema.js';

const router = Router();

// Entire user-management namespace is authenticated and manager/admin only.
router.use(authenticate());
router.use(authorize(UserRole.MANAGER, UserRole.ADMIN));

router.get('/', validate({ query: listUsersQuerySchema }), userController.listUsers);

router.post('/', validate({ body: createUserSchema }), userController.createUser);

router.get('/:id', validate({ params: userIdParamsSchema }), userController.getUserById);

router.patch(
  '/:id',
  validate({ params: userIdParamsSchema, body: updateUserSchema }),
  userController.updateUser,
);

router.delete('/:id', validate({ params: userIdParamsSchema }), userController.deactivateUser);

export default router;