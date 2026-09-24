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
 * any ingredient is short — nothing is partially applied. Returns whether any
 * stock actually moved (no lines, or recipe-less items, return false).
 */
export async function consumeIngredients(
  tx: Prisma.TransactionClient,
  params: { orderId: string; userId: string; lines: ConsumptionLine[]; note?: string },
): Promise<boolean> {
  const requirements = await computeRequirements(tx, params.lines);
  if (requirements.length === 0) return false;

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
  return true;
}

/**
 * Restore stock for ledgered entries (single ledger chapter). Entry amounts
 * are positive milli-unit quantities that get added back and recorded as
 * ORDER_CANCEL rows — the mirror image of the SALE consumption.
 */
async function restockRows(
  tx: Prisma.TransactionClient,
  entries: { inventoryItemId: string; millis: number }[],
  params: { orderId: string; userId: string; note?: string },
): Promise<void> {
  for (const entry of entries) {
    const updated = await tx.inventoryItem.update({
      where: { id: entry.inventoryItemId },
      data: { quantity: { increment: fromMillis(entry.millis) } },
    });
    await tx.inventoryTransaction.create({
      data: {
        inventoryItemId: entry.inventoryItemId,
        type: InventoryTransactionType.ORDER_CANCEL,
        quantity: fromMillis(entry.millis),
        balanceAfter: updated.quantity.toString(),
        referenceIds: params.orderId,
        userId: params.userId,
        note: params.note ?? null,
      },
    });
  }
}

/**
 * Return whatever the order is still net-consuming when it is cancelled. The
 * ledger is additive: SALE rows record what was taken (signed negative),
 * ORDER_CANCEL rows record what was already given back (signed positive), so
 * `remaining = Σ −quantity` per ingredient. Only positive remainders move.
 * This also makes the call idempotent — a fully reversed order nets to zero
 * and touches nothing.
 */
export async function reverseConsumption(
  tx: Prisma.TransactionClient,
  params: { orderId: string; userId: string; note?: string },
): Promise<boolean> {
  const rows = await tx.inventoryTransaction.findMany({
    where: {
      referenceIds: params.orderId,
      type: { in: [InventoryTransactionType.SALE, InventoryTransactionType.ORDER_CANCEL] },
    },
    select: { inventoryItemId: true, type: true, quantity: true },
  });
  if (rows.length === 0) return false;

  const net = new Map<string, number>();
  for (const row of rows) {
    const delta = -toMillis(row.quantity.toString());
    net.set(row.inventoryItemId, (net.get(row.inventoryItemId) ?? 0) + delta);
  }
  const toReturn = [...net.entries()]
    .filter(([, millis]) => millis > 0)
    .map(([inventoryItemId, millis]) => ({ inventoryItemId, millis }));
  await restockRows(tx, toReturn, params);
  return toReturn.length > 0;
}

/**
 * Return stock for a specific set of order lines (e.g. an item removed from a
 * confirmed order). Reverses the exact recipe requirement of those lines and
 * records ORDER_CANCEL rows so later netting stays correct.
 */
export async function reverseIngredients(
  tx: Prisma.TransactionClient,
  params: { orderId: string; userId: string; lines: ConsumptionLine[]; note?: string },
): Promise<boolean> {
  const requirements = await computeRequirements(tx, params.lines);
  if (requirements.length === 0) return false;
  await restockRows(
    tx,
    requirements.map((requirement) => ({
      inventoryItemId: requirement.inventoryItemId,
      millis: requirement.requiredMillis,
    })),
    params,
  );
  return true;
}