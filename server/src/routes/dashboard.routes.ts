import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
import { dashboardSummary } from '../controllers/analytics.controller.js';

const router = Router();

router.use(authenticate());
router.use(requirePermission('DASHBOARD_VIEW'));

router.get('/summary', dashboardSummary);

export default router;
