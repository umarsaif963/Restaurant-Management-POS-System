import type {
  CreateInventoryItemInput,
  InventoryItemProfile,
  InventoryTransactionProfile,
  ListInventoryItemsQuery,
  ListInventoryTransactionsQuery,
  Paginated,
  RecordInventoryTransactionInput,
  ReorderSuggestions,
  ReorderSuggestionsQuery,
  ReorderSuggestionItem,
  StockHealth,
  UpdateInventoryItemInput,
} from '@restaurant/shared';
import { InventoryTransactionType, Prisma } from '@prisma/client';
import { prisma, TRANSACTION_OPTIONS } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { fromMillis, toMillis } from '../utils/units.js';

const itemInclude = () =>
  ({
    supplier: { select: { name: true } },
  }) as const;

type ItemWithRelations = Prisma.InventoryItemGetPayload<{ include: ReturnType<typeof itemInclude> }>;

function toHealth(quantity: string, minQuantity: string): StockHealth {
  const qty = parseFloat(quantity);
  const min = parseFloat(minQuantity);
  if (qty <= 0) return 'OUT_OF_STOCK';
  if (qty < min) return 'LOW_STOCK';
  return 'IN_STOCK';
}

function toItem(item: ItemWithRelations): InventoryItemProfile {
  return {
    id: item.id,
    name: item.name,
    sku: item.sku,
    unit: item.unit,
    quantity: item.quantity.toString(),
    minQuantity: item.minQuantity.toString(),
    costPrice: item.costPrice.toString(),
    category: item.category,
    supplierName: item.supplier?.name ?? null,
    expiryDate: item.expiryDate?.toISOString() ?? null,
    isActive: item.isActive,
    health: toHealth(item.quantity.toString(), item.minQuantity.toString()),
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

async function requireItem(id: string): Promise<ItemWithRelations> {
  const item = await prisma.inventoryItem.findUnique({ where: { id }, include: itemInclude() });
  if (!item) {
    throw ApiError.notFound('Inventory item not found');
  }
  return item;
}

// ---- Inventory items ------------------------------------------

export async function listItems(params: ListInventoryItemsQuery): Promise<Paginated<InventoryItemProfile>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const where: Prisma.InventoryItemWhereInput = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } },
      { category: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.category) {
    where.category = params.category;
  }
  if (params.status === 'ACTIVE' || params.status === 'INACTIVE') {
    where.isActive = params.status === 'ACTIVE';
  }

  const [total, rows] = await prisma.$transaction([
    prisma.inventoryItem.count({ where }),
    prisma.inventoryItem.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: itemInclude(),
    }),
  ]);

  let items = rows.map(toItem);
  if (params.health) {
    items = items.filter((item) => item.health === params.health);
    return { items, page, limit, total: items.length, totalPages: Math.ceil(items.length / limit) };
  }

  return { items, page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function getItem(id: string): Promise<InventoryItemProfile> {
  return toItem(await requireItem(id));
}

export async function createItem(input: CreateInventoryItemInput): Promise<InventoryItemProfile> {
  if (input.sku) {
    const existing = await prisma.inventoryItem.findUnique({ where: { sku: input.sku } });
    if (existing) {
      throw ApiError.badRequest('SKU is already in use');
    }
  }
  const created = await prisma.inventoryItem.create({
    data: {
      name: input.name,
      sku: input.sku ?? null,
      unit: input.unit,
      quantity: input.quantity ?? '0',
      minQuantity: input.minQuantity ?? '0',
      costPrice: input.costPrice ?? '0',
      category: input.category ?? null,
      expiryDate: input.expiryDate ? new Date(input.expiryDate) : null,
      isActive: input.isActive ?? true,
    },
    include: itemInclude(),
  });
  return toItem(created);
}

export async function updateItem(id: string, input: UpdateInventoryItemInput): Promise<InventoryItemProfile> {
  await requireItem(id);
  if (input.sku) {
    const existing = await prisma.inventoryItem.findUnique({ where: { sku: input.sku } });
    if (existing && existing.id !== id) {
      throw ApiError.badRequest('SKU is already in use');
    }
  }
  const updated = await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: input.name,
      sku: input.sku === undefined ? undefined : input.sku,
      unit: input.unit,
      minQuantity: input.minQuantity,
      costPrice: input.costPrice,
      category: input.category === undefined ? undefined : input.category,
      expiryDate: input.expiryDate === undefined ? undefined : input.expiryDate === null ? null : new Date(input.expiryDate),
      isActive: input.isActive,
    },
    include: itemInclude(),
  });
  return toItem(updated);
}

export async function deleteItem(id: string): Promise<void> {
  await requireItem(id);
  await prisma.inventoryItem.delete({ where: { id } });
}

// ---- Transactions ---------------------------------------------

type TransactionRow = {
  id: string;
  inventoryItemId: string;
  type: string;
  quantity: { toString(): string };
  balanceAfter: { toString(): string } | null;
  unitCost: { toString(): string } | null;
  note: string | null;
  referenceIds: string | null;
  userId: string | null;
  createdAt: Date;
};

type OrderRef = { id: string; orderNumber: string };

function toTransaction(
  row: TransactionRow,
  itemName: string,
  userName: string | null,
  order: OrderRef | null,
): InventoryTransactionProfile {
  return {
    id: row.id,
    inventoryItemId: row.inventoryItemId,
    itemName,
    type: row.type as InventoryTransactionProfile['type'],
    quantity: row.quantity.toString(),
    balanceAfter: row.balanceAfter?.toString() ?? null,
    unitCost: row.unitCost?.toString() ?? null,
    note: row.note,
    referenceIds: row.referenceIds,
    order,
    userName,
    createdAt: row.createdAt.toISOString(),
  };
}

/**
 * Resolves which orders (if any) the movement rows were caused by, so the
 * ledger can link each order-based entry back to its order.
 */
async function orderRefByIds(ids: string[]): Promise<Map<string, OrderRef>> {
  if (ids.length === 0) return new Map();
  const orders = await prisma.order.findMany({
    where: { id: { in: ids } },
    select: { id: true, orderNumber: true },
  });
  return new Map(orders.map((order) => [order.id, order]));
}

export async function listTransactions(
  params: ListInventoryTransactionsQuery,
): Promise<Paginated<InventoryTransactionProfile>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const where: Prisma.InventoryTransactionWhereInput = {};
  if (params.itemId) where.inventoryItemId = params.itemId;
  if (params.type) where.type = params.type;

  const [total, rows] = await prisma.$transaction([
    prisma.inventoryTransaction.count({ where }),
    prisma.inventoryTransaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  const itemIds = [...new Set(rows.map((row) => row.inventoryItemId))];
  const userIds = [...new Set(rows.map((row) => row.userId).filter((id): id is string => id !== null))];
  const orderIds = [...new Set(rows.map((row) => row.referenceIds).filter((id): id is string => id !== null))];
  const [items, users, orders] = await Promise.all([
    itemIds.length > 0
      ? prisma.inventoryItem.findMany({ where: { id: { in: itemIds } }, select: { id: true, name: true } })
      : Promise.resolve([] as { id: string; name: string }[]),
    userIds.length > 0
      ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : Promise.resolve([] as { id: string; name: string }[]),
    orderRefByIds(orderIds),
  ]);
  const itemNameById = new Map(items.map((item) => [item.id, item.name]));
  const userNameById = new Map(users.map((user) => [user.id, user.name]));

  return {
    items: rows.map((row) =>
      toTransaction(
        row,
        itemNameById.get(row.inventoryItemId) ?? 'Unknown item',
        row.userId ? (userNameById.get(row.userId) ?? null) : null,
        row.referenceIds ? (orders.get(row.referenceIds) ?? null) : null,
      ),
    ),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * The stock movements a single order caused — its SALE (consumed) and
 * ORDER_CANCEL (returned) ledger rows in chronological order. Used by the
 * order detail view so staff can see exactly what an order drew from stock.
 */
export async function listOrderInventoryMovements(
  orderId: string,
): Promise<{ items: InventoryTransactionProfile[] }> {
  const rows = await prisma.inventoryTransaction.findMany({
    where: {
      referenceIds: orderId,
      type: { in: [InventoryTransactionType.SALE, InventoryTransactionType.ORDER_CANCEL] },
    },
    orderBy: { createdAt: 'asc' },
  });
  if (rows.length === 0) return { items: [] };

  const itemIds = [...new Set(rows.map((row) => row.inventoryItemId))];
  const userIds = [...new Set(rows.map((row) => row.userId).filter((id): id is string => id !== null))];
  const [items, users, order] = await Promise.all([
    itemIds.length > 0
      ? prisma.inventoryItem.findMany({ where: { id: { in: itemIds } }, select: { id: true, name: true } })
      : Promise.resolve([] as { id: string; name: string }[]),
    userIds.length > 0
      ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : Promise.resolve([] as { id: string; name: string }[]),
    prisma.order.findUnique({ where: { id: orderId }, select: { id: true, orderNumber: true } }),
  ]);
  const itemNameById = new Map(items.map((item) => [item.id, item.name]));
  const userNameById = new Map(users.map((user) => [user.id, user.name]));
  const orderRef = order ? { id: order.id, orderNumber: order.orderNumber } : null;

  return {
    items: rows.map((row) =>
      toTransaction(
        row,
        itemNameById.get(row.inventoryItemId) ?? 'Unknown item',
        row.userId ? (userNameById.get(row.userId) ?? null) : null,
        orderRef,
      ),
    ),
  };
}

/**
 * Record a stock movement. PURCHASE/RETURN/ORDER_CANCEL add stock;
 * SALE/WASTAGE/DAMAGE remove it; ADJUSTMENT overwrites the balance to the
 * given quantity (a stock-take). The new balance is written onto the item and
 * a ledger row captures the delta. Quantity math runs in integer milli-units
 * (3 decimals) to stay exact.
 */
export async function recordTransaction(
  itemId: string,
  input: RecordInventoryTransactionInput,
  userId: string,
): Promise<InventoryTransactionProfile> {
  const item = await requireItem(itemId);
  const current = toMillis(item.quantity.toString());
  const signed = input.quantity !== undefined ? toMillis(input.quantity) : current;

  let delta: number;
  let balanceAfter: number;
  switch (input.type) {
    case InventoryTransactionType.PURCHASE:
    case InventoryTransactionType.RETURN:
    case InventoryTransactionType.ORDER_CANCEL:
      delta = signed;
      balanceAfter = current + signed;
      break;
    case InventoryTransactionType.SALE:
    case InventoryTransactionType.WASTAGE:
    case InventoryTransactionType.DAMAGE:
      delta = -signed;
      balanceAfter = current - signed;
      break;
    case InventoryTransactionType.ADJUSTMENT:
      delta = signed - current;
      balanceAfter = signed;
      break;
    default:
      throw ApiError.badRequest('Unsupported transaction type');
  }

  if (balanceAfter < 0) {
    throw ApiError.conflict('This movement would make the balance negative.');
  }

  // We adopt the cost price only on purchases (new stock priced at today's
  // cost); other movements keep the item's existing unit cost so recipe and
  // stock valuations stay stable.
  const unitCost = input.unitCost !== undefined ? input.unitCost : item.costPrice.toString();
  const costChanged = input.type === InventoryTransactionType.PURCHASE;

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.inventoryTransaction.create({
      data: {
        inventoryItemId: itemId,
        type: input.type,
        quantity: fromMillis(delta),
        balanceAfter: fromMillis(balanceAfter),
        unitCost,
        note: input.note ?? null,
        userId,
      },
    });
    await tx.inventoryItem.update({
      where: { id: itemId },
      data: { quantity: fromMillis(balanceAfter), ...(costChanged ? { costPrice: unitCost } : {}) },
    });
    return row;
  }, TRANSACTION_OPTIONS);

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  return toTransaction(created, item.name, user?.name ?? null, null);
}

// ---- Reorder suggestions ----------------------------------------

const DAY_MS = 86_400_000;

/** Formats to the given decimals, trimming trailing zeros. */
function fmt(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(/\.?0+$/, '');
}

/**
 * Flags low/out-of-stock items and computes suggested purchase quantities from
 * their recent net consumption (SALE minus ORDER_CANCEL ledger rows) over the
 * lookback window, projected `leadDays` ahead plus the item's minimum buffer.
 */
export async function getReorderSuggestions(params: ReorderSuggestionsQuery): Promise<ReorderSuggestions> {
  const windowDays = params.windowDays ?? 14;
  const leadDays = params.leadDays ?? 7;
  const from = new Date(Date.now() - windowDays * DAY_MS);

  const rows = await prisma.inventoryItem.findMany({
    where: { isActive: true },
    include: itemInclude(),
  });
  const items = rows.map(toItem);
  const flagged = items.filter((item) => item.health !== 'IN_STOCK');
  if (flagged.length === 0) {
    return { generatedAt: new Date().toISOString(), windowDays, leadDays, items: [] };
  }

  const groups = await prisma.inventoryTransaction.groupBy({
    by: ['inventoryItemId', 'type'],
    where: {
      type: { in: [InventoryTransactionType.SALE, InventoryTransactionType.ORDER_CANCEL] },
      inventoryItemId: { in: flagged.map((item) => item.id) },
      createdAt: { gte: from },
    },
    _sum: { quantity: true },
  });

  const saleMillis = new Map<string, number>();
  const returnMillis = new Map<string, number>();
  for (const group of groups) {
    const millis = Math.round(Number(group._sum.quantity ?? 0) * 1000);
    if (group.type === InventoryTransactionType.SALE) {
      saleMillis.set(group.inventoryItemId, (saleMillis.get(group.inventoryItemId) ?? 0) + millis);
    } else {
      returnMillis.set(group.inventoryItemId, (returnMillis.get(group.inventoryItemId) ?? 0) + millis);
    }
  }

  const suggested: ReorderSuggestionItem[] = flagged.map((item) => {
    // SALE rows are stored negative, ORDER_CANCEL rows positive.
    const netMillis = -((saleMillis.get(item.id) ?? 0) + (returnMillis.get(item.id) ?? 0));
    const onHandMillis = toMillis(item.quantity);
    const dailyMillis = netMillis / windowDays;
    const needMillis = dailyMillis * leadDays + toMillis(item.minQuantity);
    const suggestedQuantity = Math.max(0, needMillis - onHandMillis);
    const daysOfStock =
      onHandMillis <= 0 ? '0' : dailyMillis > 0 ? fmt(onHandMillis / dailyMillis, 1) : null;

    return {
      item,
      consumptionPerDay: fmt(dailyMillis / 1000, 3),
      daysOfStock,
      projectedNeed: fmt(needMillis / 1000, 3),
      suggestedQuantity: fmt(suggestedQuantity / 1000, 3),
    };
  });

  const severity: Record<StockHealth, number> = { OUT_OF_STOCK: 0, LOW_STOCK: 1, IN_STOCK: 2 };
  suggested.sort(
    (a, b) =>
      severity[a.item.health] - severity[b.item.health] ||
      Number(b.suggestedQuantity) - Number(a.suggestedQuantity) ||
      a.item.name.localeCompare(b.item.name),
  );

  return { generatedAt: new Date().toISOString(), windowDays, leadDays, items: suggested };
}