import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import * as auditController from '../controllers/audit.controller.js';
import { listAuditLogsQuerySchema, purgeAuditLogsSchema } from '../validators/audit.schema.js';

const router = Router();

// The whole trail is management-only.
router.use(authenticate());
router.use(authorize(UserRole.MANAGER, UserRole.ADMIN));

router.get('/', validate({ query: listAuditLogsQuerySchema }), auditController.list);

router.delete('/', validate({ body: purgeAuditLogsSchema }), auditController.purge);

export default router;