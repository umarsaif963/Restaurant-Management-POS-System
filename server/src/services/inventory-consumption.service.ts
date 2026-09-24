import { InventoryTransactionType, Prisma } from '@prisma/client';
import { ApiError } from '../utils/ApiError.js';
import { fromMillis, toMillis } from '../utils/units.js';

/** A single order line whose ingredients should be consumed. */
export interface ConsumptionLine {
  menuItemId: string;
  quantity: number;
}

interface Requirement {
  inventoryItemId: string;
  name: string;
  requiredMillis: number;
}

export interface InsufficientStockEntry {
  inventoryItemId: string;
  name: string;
  required: string;
  available: string;
  message: string;
}

/**
 * Load recipes for the lines, aggregate the ingredient requirements per
 * inventory item and return per-item totals in integer milli-units. A serving
 * of a menu item is `ingredientQuantity / recipe.yield`; that is scaled by the
 * line quantity and accumulated across all products on the order. Menu items
 * without a recipe (pre-made products) legitimately consume nothing.
 */
export async function computeRequirements(
  tx: Prisma.TransactionClient,
  lines: ConsumptionLine[],
): Promise<Requirement[]> {
  const uniqueIds = [...new Set(lines.map((line) => line.menuItemId))];
  if (uniqueIds.length === 0) return [];

  const recipes = await tx.recipe.findMany({
    where: { menuItemId: { in: uniqueIds } },
    include: {
      ingredients: {
        include: { inventoryItem: { select: { id: true, name: true } } },
      },
    },
  });
  const recipeByItem = new Map(recipes.map((recipe) => [recipe.menuItemId, recipe]));

  const byIngredient = new Map<string, Requirement>();
  for (const line of lines) {
    const recipe = recipeByItem.get(line.menuItemId);
    if (!recipe || recipe.ingredients.length === 0) continue;
    for (const ingredient of recipe.ingredients) {
      const ingredientMillis = toMillis(ingredient.quantity.toString());
      if (ingredientMillis <= 0) continue;
      const requiredMillis = Math.round((ingredientMillis * line.quantity) / recipe.yield);
      if (requiredMillis <= 0) continue;
      const existing = byIngredient.get(ingredient.inventoryItemId);
      if (existing) {
        existing.requiredMillis += requiredMillis;
      } else {
        byIngredient.set(ingredient.inventoryItemId, {
          inventoryItemId: ingredient.inventoryItemId,
          name: ingredient.inventoryItem.name,
          requiredMillis,
        });
      }
    }
  }
  return [...byIngredient.values()];
}

function stockError(shortages: InsufficientStockEntry[]): ApiError {
  return new ApiError(409, 'Insufficient stock to confirm this order.', shortages);
}

/**
 * Deduct the ingredients for a set of order lines and record SALE ledger rows.
 * Must run inside the caller's Prisma transaction so the order status, kitchen
 * ticket and stock ledger commit or roll back together. Aborts with a 409 if
 * any ingredient is short — nothing is partially applied.
 */
export async function consumeIngredients(
  tx: Prisma.TransactionClient,
  params: { orderId: string; userId: string; lines: ConsumptionLine[]; note?: string },
): Promise<void> {
  const requirements = await computeRequirements(tx, params.lines);
  if (requirements.length === 0) return;

  const items = await tx.inventoryItem.findMany({
    where: { id: { in: requirements.map((r) => r.inventoryItemId) } },
    select: { id: true, name: true, quantity: true },
  });
  const availableByItem = new Map(
    items.map((item) => [item.id, toMillis(item.quantity.toString())]),
  );

  const shortages: InsufficientStockEntry[] = [];
  for (const requirement of requirements) {
    const available = availableByItem.get(requirement.inventoryItemId) ?? 0;
    if (available < requirement.requiredMillis) {
      shortages.push({
        inventoryItemId: requirement.inventoryItemId,
        name: requirement.name,
        required: fromMillis(requirement.requiredMillis),
        available: fromMillis(available),
        message: `Insufficient stock for ${requirement.name}`,
      });
    }
  }
  if (shortages.length > 0) {
    throw stockError(shortages);
  }

  for (const requirement of requirements) {
    // Atomic compare-and-set: only consume while enough stock remains. The row
    // is locked by the update, so concurrent orders on a shared last unit fail.
    const updated = await tx.inventoryItem.updateMany({
      where: {
        id: requirement.inventoryItemId,
        quantity: { gte: fromMillis(requirement.requiredMillis) },
      },
      data: { quantity: { decrement: fromMillis(requirement.requiredMillis) } },
    });
    if (updated.count === 0) {
      throw stockError([
        {
          inventoryItemId: requirement.inventoryItemId,
          name: requirement.name,
          required: fromMillis(requirement.requiredMillis),
          available: fromMillis(availableByItem.get(requirement.inventoryItemId) ?? 0),
          message: `Insufficient stock for ${requirement.name}`,
        },
      ]);
    }
    const balance = await tx.inventoryItem.findUnique({
      where: { id: requirement.inventoryItemId },
      select: { quantity: true },
    });
    await tx.inventoryTransaction.create({
      data: {
        inventoryItemId: requirement.inventoryItemId,
        type: InventoryTransactionType.SALE,
        quantity: fromMillis(-requirement.requiredMillis),
        balanceAfter: balance?.quantity.toString() ?? null,
        referenceIds: params.orderId,
        userId: params.userId,
        note: params.note ?? null,
      },
    });
  }
}