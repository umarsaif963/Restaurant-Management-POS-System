import type { Request, Response } from 'express';
import type { CreateRecipeInput, ListRecipesQuery, UpdateRecipeInput } from '@restaurant/shared';
import * as recipeService from '../services/recipe.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listRecipes = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListRecipesQuery;
  const result = await recipeService.listRecipes(query);
  res.status(200).json({ success: true, data: result });
});

export const getRecipe = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const recipe = await recipeService.getRecipe(id);
  res.status(200).json({ success: true, data: { recipe } });
});

export const createRecipe = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateRecipeInput;
  const recipe = await recipeService.createRecipe(body);
  res.status(201).json({ success: true, data: { recipe } });
});

export const updateRecipe = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateRecipeInput;
  const recipe = await recipeService.updateRecipe(id, body);
  res.status(200).json({ success: true, data: { recipe } });
});

export const deleteRecipe = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await recipeService.deleteRecipe(id);
  res.status(200).json({ success: true, data: null });
});