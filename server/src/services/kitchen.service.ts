import type {
  KitchenItemStatus,
  KitchenOrderProfile,
  KitchenOrderStatus,
  ListKitchenOrdersQuery,
  Paginated,
} from '@restaurant/shared';
import { Prisma } from '@prisma/client';
import { prisma, TRANSACTION_OPTIONS } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { realtime } from '../sockets/realtime.js';

export const KITCHEN_TRANSITIONS: Record<KitchenOrderStatus, KitchenOrderStatus[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['SERVED'],
  SERVED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** Item status applied to every line when the ticket reaches a milestone. */
const ITEM_STATUS_BY_KITCHEN_STATUS: Partial<Record<KitchenOrderStatus, KitchenItemStatus>> = {
  PREPARING: 'PREPARING',
  READY: 'READY',
  SERVED: 'SERVED',
  CANCELLED: 'CANCELLED',
};

const kitchenInclude = () =>
  ({
    items: { orderBy: { createdAt: 'asc' } },
    order: {
      select: {
        orderNumber: true,
        orderType: true,
        status: true,
        table: { select: { id: true, tableNumber: true, name: true } },
        customer: { select: { name: true } },
      },
    },
    acceptedBy: { select: { name: true } },
  }) satisfies Prisma.KitchenOrderInclude;

type KitchenWithRelations = Prisma.KitchenOrderGetPayload<{ include: ReturnType<typeof kitchenInclude> }>;

function toKitchen(kitchen: KitchenWithRelations): KitchenOrderProfile {
  return {
    id: kitchen.id,
    orderId: kitchen.orderId,
    orderNumber: kitchen.order.orderNumber,
    ticketNumber: kitchen.ticketNumber,
    status: kitchen.status,
    orderType: kitchen.order.orderType,
    orderStatus: kitchen.order.status,
    tableId: kitchen.order.table?.id ?? null,
    tableNumber: kitchen.order.table?.tableNumber ?? null,
    tableName: kitchen.order.table?.name ?? null,
    customerName: kitchen.order.customer?.name ?? null,
    notes: kitchen.notes,
    acceptedById: kitchen.acceptedById,
    acceptedByName: kitchen.acceptedBy?.name ?? null,
    startedAt: kitchen.startedAt?.toISOString() ?? null,
    readyAt: kitchen.readyAt?.toISOString() ?? null,
    completedAt: kitchen.completedAt?.toISOString() ?? null,
    createdAt: kitchen.createdAt.toISOString(),
    items: kitchen.items.map((item) => ({
      id: item.id,
      kitchenOrderId: item.kitchenOrderId,
      orderItemId: item.orderItemId,
      menuItemId: item.menuItemId,
      name: item.name,
      quantity: item.quantity,
      notes: item.notes,
      variant: item.variant,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

async function requireKitchen(id: string): Promise<KitchenWithRelations> {
  const kitchen = await prisma.kitchenOrder.findUnique({ where: { id }, include: kitchenInclude() });
  if (!kitchen) {
    throw ApiError.notFound('Kitchen ticket not found');
  }
  return kitchen;
}

export async function listKitchenOrders(
  params: ListKitchenOrdersQuery,
): Promise<Paginated<KitchenOrderProfile>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const where: Prisma.KitchenOrderWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.orderId) where.orderId = params.orderId;

  const [total, rows] = await prisma.$transaction([
    prisma.kitchenOrder.count({ where }),
    prisma.kitchenOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: kitchenInclude(),
    }),
  ]);

  return {
    items: rows.map(toKitchen),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getKitchenOrder(id: string): Promise<KitchenOrderProfile> {
  return toKitchen(await requireKitchen(id));
}

export async function updateKitchenOrderStatus(
  id: string,
  userId: string,
  status: KitchenOrderStatus,
): Promise<KitchenOrderProfile> {
  const kitchen = await prisma.kitchenOrder.findUnique({ where: { id } });
  if (!kitchen) throw ApiError.notFound('Kitchen ticket not found');

  if (status === kitchen.status) {
    return toKitchen(await requireKitchen(id));
  }
  const allowed = KITCHEN_TRANSITIONS[kitchen.status];
  if (!allowed.includes(status)) {
    throw ApiError.conflict(`Cannot move a kitchen ticket from ${kitchen.status} to ${status}.`);
  }

  const updated = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const itemStatus = ITEM_STATUS_BY_KITCHEN_STATUS[status];
    if (itemStatus) {
      await tx.kitchenOrderItem.updateMany({
        where: { kitchenOrderId: id },
        data: { status: itemStatus },
      });
    }
    return tx.kitchenOrder.update({
      where: { id },
      data: {
        status,
        acceptedById: status === 'ACCEPTED' ? userId : kitchen.acceptedById,
        startedAt: status === 'PREPARING' ? now : kitchen.startedAt,
        readyAt: status === 'READY' ? now : kitchen.readyAt,
        completedAt:
          status === 'COMPLETED'
            ? now
            : status === 'CANCELLED'
              ? now
              : kitchen.completedAt,
      },
      include: kitchenInclude(),
    });
  }, TRANSACTION_OPTIONS);

  realtime.kitchenUpdated({ kitchenOrderId: id, orderId: kitchen.orderId });

  return toKitchen(updated);
}