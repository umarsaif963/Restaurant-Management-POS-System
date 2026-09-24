import type {
  CreateInventoryItemInput,
  InventoryItemProfile,
  InventoryTransactionProfile,
  ListInventoryItemsQuery,
  ListInventoryTransactionsQuery,
  Paginated,
  RecordInventoryTransactionInput,
  StockHealth,
  UpdateInventoryItemInput,
} from '@restaurant/shared';
import { InventoryTransactionType, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
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
  userId: string | null;
  createdAt: Date;
};

function toTransaction(row: TransactionRow, itemName: string, userName: string | null): InventoryTransactionProfile {
  return {
    id: row.id,
    inventoryItemId: row.inventoryItemId,
    itemName,
    type: row.type as InventoryTransactionProfile['type'],
    quantity: row.quantity.toString(),
    balanceAfter: row.balanceAfter?.toString() ?? null,
    unitCost: row.unitCost?.toString() ?? null,
    note: row.note,
    userName,
    createdAt: row.createdAt.toISOString(),
  };
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
  const [items, users] = await Promise.all([
    itemIds.length > 0
      ? prisma.inventoryItem.findMany({ where: { id: { in: itemIds } }, select: { id: true, name: true } })
      : Promise.resolve([] as { id: string; name: string }[]),
    userIds.length > 0
      ? prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } })
      : Promise.resolve([] as { id: string; name: string }[]),
  ]);
  const itemNameById = new Map(items.map((item) => [item.id, item.name]));
  const userNameById = new Map(users.map((user) => [user.id, user.name]));

  return {
    items: rows.map((row) =>
      toTransaction(row, itemNameById.get(row.inventoryItemId) ?? 'Unknown item', row.userId ? (userNameById.get(row.userId) ?? null) : null),
    ),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
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
  });

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });
  return toTransaction(created, item.name, user?.name ?? null);
}