import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as auditController from '../controllers/audit.controller.js';
import { listAuditLogsQuerySchema, purgeAuditLogsSchema } from '../validators/audit.schema.js';

const router = Router();

// The whole trail is management-only.
router.use(authenticate());
router.use(requirePermission('AUDIT_LOGS_VIEW'));

router.get('/', validate({ query: listAuditLogsQuerySchema }), auditController.list);

router.delete('/', validate({ body: purgeAuditLogsSchema }), auditController.purge);

export default router;
