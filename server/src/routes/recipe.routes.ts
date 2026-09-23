import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import * as recipeController from '../controllers/recipe.controller.js';
import {
  createRecipeSchema,
  listRecipesQuerySchema,
  resourceIdParamsSchema,
  updateRecipeSchema,
} from '../validators/recipe.schema.js';

const router = Router();

router.use(authenticate());

const managers = [UserRole.MANAGER, UserRole.ADMIN];

router.get('/', validate({ query: listRecipesQuerySchema }), recipeController.listRecipes);
router.get(
  '/:id',
  validate({ params: resourceIdParamsSchema }),
  recipeController.getRecipe,
);
router.post(
  '/',
  authorize(...managers),
  validate({ body: createRecipeSchema }),
  recipeController.createRecipe,
);
router.patch(
  '/:id',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema, body: updateRecipeSchema }),
  recipeController.updateRecipe,
);
router.delete(
  '/:id',
  authorize(...managers),
  validate({ params: resourceIdParamsSchema }),
  recipeController.deleteRecipe,
);

export default router;