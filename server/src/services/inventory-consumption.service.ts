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
 * One ingredient's contribution to how much of a product can be prepared.
 * `availableMillis` is current on-hand stock and `perServingMillis` is what a
 * single unit consumes, both in the inventory item's own unit (see
 * `getMaxProducible` for why no unit conversion is involved).
 */
export interface AvailabilityLimit {
  inventoryItemId: string;
  name: string;
  /** Stock on hand, in the inventory item's unit. */
  available: string;
  /** What one unit of the product consumes, in the inventory item's unit. */
  perServing: string;
  /**
   * The same figure in exact integer milli-units, unrounded.
   *
   * Clients accumulate cart usage in this field rather than parsing
   * `perServing`, because `perServing` is a 3-decimal display string and a
   * yield of 3 is not representable in 3 decimals. Integer millis are the same
   * representation the server deduction path uses, so a client-side estimate
   * can never disagree with the authoritative check by rounding.
   */
  perServingMillis: number;
  /** How many units this single ingredient alone would allow. */
  maxByThisIngredient: number;
}

/**
 * Why a product's availability is capped, plus the per-ingredient breakdown
 * behind the cap. `limitedBy` is the single most restrictive ingredient —
 * the MIN across the whole recipe, which is what actually binds.
 */
export interface ProductAvailability {
  menuItemId: string;
  /**
   * Units of this product that current stock can support. `null` when the
   * product has no recipe (pre-made goods are not stock-constrained) — the UI
   * must treat `null` as "no recipe limit", never as zero.
   */
  maxAvailable: number | null;
  /** Per-ingredient breakdown, ordered most-restrictive first. */
  limits: AvailabilityLimit[];
  /** The binding ingredient, or `null` when nothing caps this product. */
  limitedBy: AvailabilityLimit | null;
}

/**
 * The recipe shape the availability math needs. Both the single-item and the
 * batched path feed this same structure so the rule has exactly one home.
 */
type RecipeWithIngredientStock = {
  yield: number;
  ingredients: {
    inventoryItemId: string;
    quantity: Prisma.Decimal;
    inventoryItem: { id: string; name: string; quantity: Prisma.Decimal };
  }[];
};

/**
 * The availability rule itself: MIN across every ingredient in the recipe.
 *
 * Every ingredient is considered and the most restrictive one wins, mirroring
 * the example in the spec: with 11 buns, 4 patties, 10 cheese and 25 servings
 * of sauce, the answer is MIN(11, 4, 10, 25) = 4.
 *
 * All arithmetic stays in integer milli-units, exactly like
 * `computeRequirements`, so repeated division cannot drift. Rounding is
 * deliberately `Math.floor`: a partial serving is not sellable, and the
 * deduction path would reject it anyway.
 *
 * Units need no conversion. `RecipeIngredient` carries no unit of its own, so
 * a recipe quantity is always denominated in the inventory item's own unit
 * (a KG ingredient's recipe row is in KG). Converting between g/kg would be a
 * second, parallel unit system that the schema does not describe.
 */
export function computeAvailability(
  menuItemId: string,
  recipe: RecipeWithIngredientStock | null,
): ProductAvailability {
  // No recipe, or a recipe with no ingredients: this product is not made from
  // stock, so there is nothing to cap it.
  if (!recipe || recipe.ingredients.length === 0) {
    return { menuItemId, maxAvailable: null, limits: [], limitedBy: null };
  }

  const servings = recipe.yield > 0 ? recipe.yield : 1;
  const limits: AvailabilityLimit[] = [];

  for (const ingredient of recipe.ingredients) {
    const ingredientMillis = toMillis(ingredient.quantity.toString());
    if (ingredientMillis <= 0) continue;

    const availableMillis = toMillis(ingredient.inventoryItem.quantity.toString());
    // A serving is ingredientQuantity / yield, so the units this ingredient
    // supports are available * yield / ingredientQuantity. The per-serving
    // figure is kept as a fraction of milli-units so it survives a yield that
    // does not divide evenly.
    const perServingMillis = ingredientMillis / servings;
    const maxByThisIngredient = Math.floor((availableMillis * servings) / ingredientMillis);

    limits.push({
      inventoryItemId: ingredient.inventoryItemId,
      name: ingredient.inventoryItem.name,
      available: ingredient.inventoryItem.quantity.toString(),
      perServing: fromMillis(Math.round(perServingMillis)),
      perServingMillis,
      maxByThisIngredient,
    });
  }

  if (limits.length === 0) {
    return { menuItemId, maxAvailable: null, limits: [], limitedBy: null };
  }

  // Most restrictive first, so the UI can lead with the binding ingredient.
  limits.sort((a, b) => a.maxByThisIngredient - b.maxByThisIngredient);
  const limitedBy = limits[0];

  return {
    menuItemId,
    maxAvailable: Math.max(0, limitedBy.maxByThisIngredient),
    limits,
    limitedBy,
  };
}

/** Recipe selection shared by the single and batched availability lookups. */
const availabilityRecipeInclude = {
  ingredients: {
    include: { inventoryItem: { select: { id: true, name: true, quantity: true } } },
  },
} as const;

/**
 * Maximum number of units of a single product that current inventory can
 * support. See `computeAvailability` for the rule.
 */
export async function getMaxProducible(
  tx: Prisma.TransactionClient,
  menuItemId: string,
): Promise<ProductAvailability> {
  const recipe = await tx.recipe.findUnique({
    where: { menuItemId },
    include: availabilityRecipeInclude,
  });
  return computeAvailability(menuItemId, recipe);
}

/**
 * Availability for many products in a single query.
 *
 * The menu list is the hottest read path in the POS and it renders a whole page
 * of items at once; calling `getMaxProducible` per item would add one recipe
 * query per row. This fetches every recipe for the page in one round trip and
 * runs the same pure rule, so the batched result can never drift from the
 * single-item result.
 *
 * Returns a map keyed by menu item id. Products without a recipe are present
 * with `maxAvailable: null`, so callers can rely on the key existing for every
 * id they asked about.
 */
export async function getMaxProducibleForMenuItems(
  tx: Prisma.TransactionClient,
  menuItemIds: string[],
): Promise<Map<string, ProductAvailability>> {
  const uniqueIds = [...new Set(menuItemIds)];
  const byMenuItemId = new Map<string, ProductAvailability>();
  if (uniqueIds.length === 0) return byMenuItemId;

  const recipes = await tx.recipe.findMany({
    where: { menuItemId: { in: uniqueIds } },
    include: availabilityRecipeInclude,
  });
  const recipeByMenuItemId = new Map(recipes.map((recipe) => [recipe.menuItemId, recipe]));

  for (const menuItemId of uniqueIds) {
    byMenuItemId.set(menuItemId, computeAvailability(menuItemId, recipeByMenuItemId.get(menuItemId) ?? null));
  }
  return byMenuItemId;
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
 * Aggregate the ingredient requirements for `lines` and compare them against
 * current stock in one pass, returning both. Sharing this keeps the "is there
 * enough?" answer identical between the fail-fast check and the real deduction.
 *
 * Products without a recipe contribute no requirements, so pre-made items are
 * never reported as short.
 */
async function resolveStock(
  tx: Prisma.TransactionClient,
  lines: ConsumptionLine[],
): Promise<{ requirements: Requirement[]; shortages: InsufficientStockEntry[] }> {
  const requirements = await computeRequirements(tx, lines);
  if (requirements.length === 0) return { requirements, shortages: [] };

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
  return { requirements, shortages };
}

/**
 * Every ingredient that current stock cannot cover for `lines`. An empty array
 * means stock can satisfy the order.
 */
export async function findShortages(
  tx: Prisma.TransactionClient,
  lines: ConsumptionLine[],
): Promise<InsufficientStockEntry[]> {
  return (await resolveStock(tx, lines)).shortages;
}

/**
 * Reject an order whose ingredients are short, without touching inventory.
 *
 * This is a fail-fast gate, not the authority: stock is only really consumed by
 * `consumeIngredients` when the order is confirmed, and that path keeps its own
 * atomic compare-and-set. Catching the problem at order-creation time means the
 * cashier learns about it while the cart is still open instead of after the
 * ticket reaches the kitchen, and the response carries the same shortfall
 * payload the confirm path returns.
 *
 * Must be called inside the caller's transaction so the check and the order
 * write see one consistent view.
 */
export async function assertStockAvailable(
  tx: Prisma.TransactionClient,
  lines: ConsumptionLine[],
  message = 'Insufficient stock for this order.',
): Promise<void> {
  const shortages = await findShortages(tx, lines);
  if (shortages.length > 0) {
    throw new ApiError(409, message, shortages);
  }
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
  const { requirements, shortages } = await resolveStock(tx, params.lines);
  if (requirements.length === 0) return false;

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
      // Re-read rather than reuse the pre-check figure: this branch means a
      // concurrent transaction took the stock first, so the earlier number is
      // stale and the caller deserves the balance that actually lost the race.
      const current = await tx.inventoryItem.findUnique({
        where: { id: requirement.inventoryItemId },
        select: { quantity: true },
      });
      throw stockError([
        {
          inventoryItemId: requirement.inventoryItemId,
          name: requirement.name,
          required: fromMillis(requirement.requiredMillis),
          available: current?.quantity.toString() ?? '0.000',
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