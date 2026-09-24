import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { dashboardSummary } from '../controllers/analytics.controller.js';

const router = Router();

router.use(authenticate());
router.use(authorize(UserRole.MANAGER, UserRole.ADMIN));

router.get('/summary', dashboardSummary);

export default router;