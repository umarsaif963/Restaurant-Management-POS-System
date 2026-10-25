import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
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

router.get(
  '/',
  requirePermission('RECIPES_READ'),
  validate({ query: listRecipesQuerySchema }),
  recipeController.listRecipes,
);
router.get(
  '/:id',
  requirePermission('RECIPES_READ'),
  validate({ params: resourceIdParamsSchema }),
  recipeController.getRecipe,
);
router.post(
  '/',
  requirePermission('RECIPES_WRITE'),
  validate({ body: createRecipeSchema }),
  recipeController.createRecipe,
);
router.patch(
  '/:id',
  requirePermission('RECIPES_WRITE'),
  validate({ params: resourceIdParamsSchema, body: updateRecipeSchema }),
  recipeController.updateRecipe,
);
router.delete(
  '/:id',
  requirePermission('RECIPES_WRITE'),
  validate({ params: resourceIdParamsSchema }),
  recipeController.deleteRecipe,
);

export default router;
