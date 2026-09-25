import type {
  ChangePurchaseStatusInput,
  CreatePurchaseInput,
  ListPurchasesQuery,
  Paginated,
  PurchaseProfile,
  UpdatePurchaseInput,
} from '@restaurant/shared';
import { InventoryTransactionType, Prisma } from '@prisma/client';
import { prisma, TRANSACTION_OPTIONS } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { toCents, fromCents } from '../utils/money.js';
import { fromMillis, toMillis } from '../utils/units.js';

type PurchaseWithRelations = Prisma.PurchaseGetPayload<{
  include: {
    supplier: { select: { name: true } };
    items: { include: { inventoryItem: { select: { name: true; unit: true } } } };
  };
}>;

function toPurchase(purchase: PurchaseWithRelations): PurchaseProfile {
  const items = purchase.items.map((item) => ({
    id: item.id,
    inventoryItemId: item.inventoryItemId,
    itemName: item.inventoryItem.name,
    unit: item.inventoryItem.unit,
    quantity: item.quantity.toString(),
    unitCost: item.unitCost.toString(),
    amount: item.amount.toString(),
  }));

  return {
    id: purchase.id,
    purchaseNumber: purchase.purchaseNumber,
    supplierId: purchase.supplierId,
    supplierName: purchase.supplier.name,
    status: purchase.status,
    totalAmount: purchase.totalAmount.toString(),
    notes: purchase.notes,
    receivedAt: purchase.receivedAt?.toISOString() ?? null,
    items,
    itemCount: items.length,
    createdAt: purchase.createdAt.toISOString(),
    updatedAt: purchase.updatedAt.toISOString(),
  };
}

const purchaseInclude = () =>
  ({
    supplier: { select: { name: true } },
    items: {
      orderBy: { createdAt: 'asc' },
      include: { inventoryItem: { select: { name: true, unit: true } } },
    },
  }) as const;

async function requirePurchase(id: string): Promise<PurchaseWithRelations> {
  const purchase = await prisma.purchase.findUnique({ where: { id }, include: purchaseInclude() });
  if (!purchase) {
    throw ApiError.notFound('Purchase not found');
  }
  return purchase;
}

async function nextPurchaseNumber(): Promise<string> {
  const last = await prisma.purchase.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { purchaseNumber: true },
  });
  let sequence = 1000;
  if (last) {
    const trailing = Number(last.purchaseNumber.slice(2));
    if (Number.isFinite(trailing)) {
      sequence = Math.max(sequence, trailing + 1);
    }
  }
  return `PO${String(sequence).padStart(6, '0')}`;
}

function lineAmountCents(quantity: string, unitCost: string): number {
  return Math.round(parseFloat(quantity) * toCents(unitCost));
}

type PurchaseLineInput = { inventoryItemId: string; quantity: string; unitCost: string };

async function ensureItemsExist(inputs: PurchaseLineInput[]): Promise<void> {
  const ids = [...new Set(inputs.map((item) => item.inventoryItemId))];
  const count = await prisma.inventoryItem.count({ where: { id: { in: ids } } });
  if (count !== ids.length) {
    throw ApiError.badRequest('One or more inventory items do not exist');
  }
}

function linesToCreate(items: PurchaseLineInput[]) {
  return items.map((item) => ({
    inventoryItemId: item.inventoryItemId,
    quantity: item.quantity,
    unitCost: item.unitCost,
    amount: fromCents(lineAmountCents(item.quantity, item.unitCost)),
  }));
}

function linesTotalCents(items: PurchaseLineInput[]): number {
  return items.reduce((sum, item) => sum + lineAmountCents(item.quantity, item.unitCost), 0);
}

export async function listPurchases(
  params: ListPurchasesQuery,
): Promise<Paginated<PurchaseProfile>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const where: Prisma.PurchaseWhereInput = {};
  if (params.search) {
    where.OR = [
      { purchaseNumber: { contains: params.search, mode: 'insensitive' } },
      { supplier: { name: { contains: params.search, mode: 'insensitive' } } },
    ];
  }
  if (params.status) {
    where.status = params.status;
  }

  const [total, rows] = await prisma.$transaction([
    prisma.purchase.count({ where }),
    prisma.purchase.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: purchaseInclude(),
    }),
  ]);

  return { items: rows.map(toPurchase), page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function getPurchase(id: string): Promise<PurchaseProfile> {
  return toPurchase(await requirePurchase(id));
}

export async function createPurchase(
  input: CreatePurchaseInput,
): Promise<PurchaseProfile> {
  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId }, select: { id: true } });
  if (!supplier) {
    throw ApiError.badRequest('Supplier not found');
  }
  await ensureItemsExist(input.items);

  const purchaseNumber = await nextPurchaseNumber();
  const created = await prisma.purchase.create({
    data: {
      purchaseNumber,
      supplierId: input.supplierId,
      notes: input.notes ?? null,
      status: 'PENDING',
      totalAmount: fromCents(linesTotalCents(input.items)),
      items: { create: linesToCreate(input.items) },
    },
    include: purchaseInclude(),
  });

  return toPurchase(created);
}

export async function updatePurchase(
  id: string,
  input: UpdatePurchaseInput,
): Promise<PurchaseProfile> {
  const purchase = await requirePurchase(id);
  if (purchase.status !== 'PENDING') {
    throw ApiError.conflict('Only pending purchases can be edited');
  }
  if (input.items) {
    await ensureItemsExist(input.items);
  }

  return prisma.$transaction(async (tx) => {
    if (input.items) {
      await tx.purchaseItem.deleteMany({ where: { purchaseId: id } });
    }
    const updated = await tx.purchase.update({
      where: { id },
      data: {
        notes: input.notes === undefined ? undefined : input.notes,
        totalAmount: input.items ? fromCents(linesTotalCents(input.items)) : undefined,
        items: input.items ? { create: linesToCreate(input.items) } : undefined,
      },
      include: purchaseInclude(),
    });
    return toPurchase(updated);
  }, TRANSACTION_OPTIONS);
}

export async function deletePurchase(id: string): Promise<void> {
  const purchase = await requirePurchase(id);
  if (purchase.status !== 'PENDING') {
    throw ApiError.conflict('Only pending purchases can be deleted');
  }
  await prisma.purchase.delete({ where: { id } });
}

/**
 * Advance a pending purchase. CANCELLING just marks the order. RECEIVING is the
 * real goods-in event: line items for the same inventory item are merged, then
 * in one transaction we write a PURCHASE ledger row per item (adopting the
 * weighted-average unit cost), bump the item balances, and stamp the purchase
 * as received. Any negative balance aborts the whole receive with a 409 so
 * stock is never left partially applied.
 */
export async function changePurchaseStatus(
  id: string,
  input: ChangePurchaseStatusInput,
  userId: string,
): Promise<PurchaseProfile> {
  const purchase = await requirePurchase(id);

  if (purchase.status !== 'PENDING') {
    throw ApiError.conflict(`This purchase is already ${purchase.status.toLowerCase()}`);
  }

  if (input.status === 'CANCELLED') {
    const updated = await prisma.purchase.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: purchaseInclude(),
    });
    return toPurchase(updated);
  }

  // ---- RECEIVE -------------------------------------------------------
  // Merge lines by item: sum the quantities, keep the total cost so the
  // adopted unit cost becomes a weighted average across the lines.
  const merged = new Map<string, { quantity: number; costCents: number }>();
  for (const item of purchase.items) {
    const entry = merged.get(item.inventoryItemId) ?? { quantity: 0, costCents: 0 };
    entry.quantity += toMillis(item.quantity.toString());
    entry.costCents += lineAmountCents(item.quantity.toString(), item.unitCost.toString());
    merged.set(item.inventoryItemId, entry);
  }

  const currentBalances = await prisma.inventoryItem.findMany({
    where: { id: { in: [...merged.keys()] } },
    select: { id: true, quantity: true },
  });
  const balanceByItem = new Map(currentBalances.map((item) => [item.id, toMillis(item.quantity.toString())]));

  const rows = [...merged.entries()].map(([itemId, entry]) => {
    const current = balanceByItem.get(itemId) ?? 0;
    const balanceAfter = current + entry.quantity;
    if (balanceAfter < 0) {
      throw ApiError.conflict('Receiving this purchase would make inventory negative');
    }
    const unitCostCents = Math.round((entry.costCents * 1000) / entry.quantity);
    return {
      inventoryItemId: itemId,
      quantity: entry.quantity,
      balanceAfter,
      unitCost: fromCents(unitCostCents),
      purchaseId: purchase.id,
    };
  });

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      await tx.inventoryItem.update({
        where: { id: row.inventoryItemId },
        data: { quantity: fromMillis(row.balanceAfter), costPrice: row.unitCost },
      });
      await tx.inventoryTransaction.create({
        data: {
          inventoryItemId: row.inventoryItemId,
          type: InventoryTransactionType.PURCHASE,
          quantity: fromMillis(row.quantity),
          balanceAfter: fromMillis(row.balanceAfter),
          unitCost: row.unitCost,
          note: `Received ${purchase.purchaseNumber}`,
          userId,
        },
      });
    }
    await tx.purchase.update({
      where: { id },
      data: { status: 'RECEIVED', receivedAt: new Date() },
    });
  }, TRANSACTION_OPTIONS);

  return toPurchase(await requirePurchase(id));
}