import type {
  CreateRecipeInput,
  ListRecipesQuery,
  Paginated,
  RecipeProfile,
  UpdateRecipeInput,
} from '@restaurant/shared';
import { Prisma } from '@prisma/client';
import { prisma, TRANSACTION_OPTIONS } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { fromCents, toCents } from '../utils/money.js';

const recipeInclude = () =>
  ({
    menuItem: { select: { name: true, price: true } },
    ingredients: {
      orderBy: { createdAt: 'asc' },
      include: { inventoryItem: { select: { id: true, name: true, unit: true, costPrice: true } } },
    },
  }) as const;

type RecipeWithRelations = Prisma.RecipeGetPayload<{ include: ReturnType<typeof recipeInclude> }>;

function toRecipe(recipe: RecipeWithRelations): RecipeProfile {
  const items = recipe.ingredients.map((ingredient) => {
    const costPerUnit = parseFloat(ingredient.inventoryItem.costPrice.toString());
    const quantity = parseFloat(ingredient.quantity.toString());
    // quantity × unit cost, rounded at 2 decimals (money)
    const lineCostCents = Math.round(quantity * costPerUnit * 100);
    return {
      id: ingredient.id,
      inventoryItemId: ingredient.inventoryItemId,
      itemName: ingredient.inventoryItem.name,
      unit: ingredient.inventoryItem.unit,
      quantity: ingredient.quantity.toString(),
      costPrice: ingredient.inventoryItem.costPrice.toString(),
      lineCost: fromCents(lineCostCents),
    };
  });

  const totalCostCents = items.reduce((sum, item) => sum + toCents(item.lineCost), 0);
  const yieldCount = recipe.yield || 1;
  const costPerUnitCents = yieldCount > 0 ? Math.round(totalCostCents / yieldCount) : 0;

  return {
    id: recipe.id,
    menuItemId: recipe.menuItemId,
    menuItemName: recipe.menuItem.name,
    menuItemPrice: recipe.menuItem.price.toString(),
    name: recipe.name,
    yield: yieldCount,
    totalCost: fromCents(totalCostCents),
    costPerUnit: fromCents(costPerUnitCents),
    hasIngredients: recipe.ingredients.length > 0,
    ingredients: items,
    createdAt: recipe.createdAt.toISOString(),
    updatedAt: recipe.updatedAt.toISOString(),
  };
}

async function requireRecipe(id: string): Promise<RecipeWithRelations> {
  const recipe = await prisma.recipe.findUnique({ where: { id }, include: recipeInclude() });
  if (!recipe) {
    throw ApiError.notFound('Recipe not found');
  }
  return recipe;
}

export async function listRecipes(params: ListRecipesQuery): Promise<Paginated<RecipeProfile>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const where: Prisma.RecipeWhereInput = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { menuItem: { name: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.recipe.count({ where }),
    prisma.recipe.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: recipeInclude(),
    }),
  ]);

  return {
    items: rows.map(toRecipe),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getRecipe(id: string): Promise<RecipeProfile> {
  return toRecipe(await requireRecipe(id));
}

async function ensureMenuItemExists(menuItemId: string): Promise<void> {
  const item = await prisma.menuItem.findUnique({ where: { id: menuItemId }, select: { id: true } });
  if (!item) {
    throw ApiError.badRequest('Menu item not found');
  }
}

async function ensureIngredientsExist(ingredients: { inventoryItemId: string }[]): Promise<void> {
  const ids = [...new Set(ingredients.map((ingredient) => ingredient.inventoryItemId))];
  const count = await prisma.inventoryItem.count({ where: { id: { in: ids } } });
  if (count !== ids.length) {
    throw ApiError.badRequest('One or more ingredients do not exist');
  }
}

export async function createRecipe(input: CreateRecipeInput): Promise<RecipeProfile> {
  const existing = await prisma.recipe.findUnique({ where: { menuItemId: input.menuItemId } });
  if (existing) {
    throw ApiError.conflict('A recipe already exists for this menu item');
  }
  await ensureMenuItemExists(input.menuItemId);
  await ensureIngredientsExist(input.ingredients);

  const recipe = await prisma.recipe.create({
    data: {
      menuItemId: input.menuItemId,
      name: input.name,
      yield: input.yield ?? 1,
      ingredients: {
        create: input.ingredients.map((ingredient) => ({
          inventoryItemId: ingredient.inventoryItemId,
          quantity: ingredient.quantity,
        })),
      },
    },
    include: recipeInclude(),
  });
  return toRecipe(recipe);
}

export async function updateRecipe(id: string, input: UpdateRecipeInput): Promise<RecipeProfile> {
  await requireRecipe(id);
  if (input.ingredients) {
    await ensureIngredientsExist(input.ingredients);
  }

  return prisma.$transaction(async (tx) => {
    if (input.ingredients) {
      await tx.recipeIngredient.deleteMany({ where: { recipeId: id } });
    }
    const recipe = await tx.recipe.update({
      where: { id },
      data: {
        name: input.name,
        yield: input.yield,
        ingredients: input.ingredients
          ? { create: input.ingredients.map((ingredient) => ({ inventoryItemId: ingredient.inventoryItemId, quantity: ingredient.quantity })) }
          : undefined,
      },
      include: recipeInclude(),
    });
    return toRecipe(recipe);
  }, TRANSACTION_OPTIONS);
}

export async function deleteRecipe(id: string): Promise<void> {
  await requireRecipe(id);
  await prisma.recipe.delete({ where: { id } });
}