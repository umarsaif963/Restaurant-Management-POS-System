import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as settingsController from '../controllers/settings.controller.js';
import { updateSettingsBodySchema } from '../validators/settings.schema.js';

const router = Router();

router.use(authenticate());

router.get('/', requirePermission('SETTINGS_READ'), settingsController.getSettings);
router.patch(
  '/',
  requirePermission('SETTINGS_WRITE'),
  validate({ body: updateSettingsBodySchema }),
  settingsController.updateSettings,
);

export default router;
