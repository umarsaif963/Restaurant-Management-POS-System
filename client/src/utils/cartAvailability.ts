import type { AvailabilityLimitProfile, MenuItemProfile } from '@restaurant/shared';

/** The minimum a cart line must expose for the availability math. */
export interface AvailabilityCartLine {
  menuItemId: string;
  quantity: number;
}

export interface CartAvailability {
  /**
   * How many more units of this product the cart may still take.
   * `null` means the product is not recipe-capped (no recipe), so the normal
   * UI cap applies. `0` means stock is exhausted.
   */
  remaining: number | null;
  /** The most restrictive ingredient once the rest of the cart is counted. */
  limitedBy: AvailabilityLimitProfile | null;
  /** Ingredient id -> milli-units the whole cart already claims. */
  usage: Map<string, number>;
}

const UNCAPPED: CartAvailability = { remaining: null, limitedBy: null, usage: new Map() };

/**
 * How many more units of `candidate` the cart can take, after accounting for
 * the stock that every other line in the cart has already claimed.
 *
 * Stock is shared, so a cart holding 3 burgers has already eaten 3 patties out
 * of the pool the 4th burger is competing for. Working per ingredient —
 * `floor((available - claimedByCart) / perServing)`, then MIN across the
 * recipe — is the same rule the server applies in `computeAvailability`, with
 * the cart's own claims subtracted first.
 *
 * This is a pure function over data already in the RTK Query cache, so raising
 * the quantity never triggers a request. The server re-checks authoritatively
 * when the order is submitted.
 */
export function evaluateCartAvailability(
  candidate: MenuItemProfile,
  cart: AvailabilityCartLine[],
  itemsById: Map<string, MenuItemProfile>,
): CartAvailability {
  const limits = candidate.availability?.limits ?? [];
  if (candidate.availability?.maxAvailable === null || limits.length === 0) {
    return UNCAPPED;
  }

  // What the whole cart already claims of each ingredient.
  const usage = new Map<string, number>();
  for (const line of cart) {
    const lineItem = itemsById.get(line.menuItemId);
    if (!lineItem) continue;
    for (const limit of lineItem.availability?.limits ?? []) {
      usage.set(
        limit.inventoryItemId,
        (usage.get(limit.inventoryItemId) ?? 0) + limit.perServingMillis * line.quantity,
      );
    }
  }

  let remaining = Number.POSITIVE_INFINITY;
  let limitedBy: AvailabilityLimitProfile | null = null;

  for (const limit of limits) {
    if (limit.perServingMillis <= 0) continue;
    const availableMillis = Math.round(parseFloat(limit.available) * 1000);
    const claimed = usage.get(limit.inventoryItemId) ?? 0;
    const left = Math.max(0, availableMillis - claimed);
    const allowed = Math.floor(left / limit.perServingMillis);
    if (allowed < remaining) {
      remaining = allowed;
      limitedBy = limit;
    }
  }

  if (limitedBy === null) return UNCAPPED;
  return { remaining: Math.max(0, remaining), limitedBy, usage };
}

/**
 * Human-readable reason a product cannot be added any further, e.g.
 * "Limit reached: only 2 more, limited by Beef Patty (78 in stock)".
 * Returns `null` when the product is not at its ceiling.
 */
export function describeCartLimit(
  availability: CartAvailability,
  unitLabel = (name: string) => name,
): string | null {
  const { remaining, limitedBy } = availability;
  if (remaining === null || remaining > 0 || limitedBy === null) return null;
  const stock = parseFloat(limitedBy.available);
  // Trim trailing zeros so 4 reads "4" and 25.4 reads "25.4", not "25.40".
  const stockText = String(Number(stock.toFixed(3)));
  return `Limit reached: ${unitLabel(limitedBy.name)} allows no more (${stockText} in stock).`;
}

/** Quantity cap for a product tile or pick modal, falling back to `fallbackMax`. */
export function quantityCeiling(
  availability: CartAvailability,
  fallbackMax: number,
): number {
  if (availability.remaining === null) return fallbackMax;
  return Math.min(fallbackMax, availability.remaining);
}
