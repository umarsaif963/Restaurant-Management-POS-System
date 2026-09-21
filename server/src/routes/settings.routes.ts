import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import * as settingsController from '../controllers/settings.controller.js';
import { updateSettingsBodySchema } from '../validators/settings.schema.js';

const router = Router();

router.use(authenticate());

router.get('/', settingsController.getSettings);
router.patch(
  '/',
  authorize(UserRole.MANAGER, UserRole.ADMIN),
  validate({ body: updateSettingsBodySchema }),
  settingsController.updateSettings,
);

export default router;