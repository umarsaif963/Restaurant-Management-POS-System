import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { platformScope, requirePlatformAdmin } from '../middleware/permissions.js';
import { validate } from '../middleware/validate.js';
import * as platformController from '../controllers/platform.controller.js';
import {
  listPlatformRestaurantsQuerySchema,
  platformRestaurantIdParamsSchema,
  updatePlatformRestaurantSchema,
} from '../validators/platform.schema.js';

const router = Router();

// The platform console is the only place that may look across restaurants.
router.use(authenticate());
router.use(requirePlatformAdmin());
router.use(platformScope());

router.get(
  '/stats',
  requirePlatformAdmin(),
  platformController.getStats,
);

router.get(
  '/restaurants',
  validate({ query: listPlatformRestaurantsQuerySchema }),
  platformController.listRestaurants,
);

router.get(
  '/restaurants/:id',
  validate({ params: platformRestaurantIdParamsSchema }),
  platformController.getRestaurant,
);

router.patch(
  '/restaurants/:id',
  validate({ params: platformRestaurantIdParamsSchema, body: updatePlatformRestaurantSchema }),
  platformController.updateRestaurant,
);

export default router;
