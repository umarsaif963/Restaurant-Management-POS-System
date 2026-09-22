import type {
  AddOrderItemsInput,
  CreateOrderInput,
  CreateOrderItemInput,
  ListOrdersQuery,
  OrderItemProfile,
  OrderProfile,
  Paginated,
  UpdateOrderInput,
  UpdateOrderStatusInput,
} from '@restaurant/shared';
import { OrderStatus, Prisma, type Order } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { fromCents, percentOf, toCents } from '../utils/money.js';
import { realtime } from '../sockets/realtime.js';

const ALLOW_ITEM_EDITS: OrderStatus[] = [OrderStatus.PENDING, OrderStatus.CONFIRMED];

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.SERVED],
  [OrderStatus.SERVED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
};

const orderInclude = (): Prisma.OrderInclude => ({
  items: { orderBy: { createdAt: 'asc' } },
  table: { select: { tableNumber: true, name: true } },
  customer: { select: { name: true } },
  user: { select: { name: true } },
});

type OrderWithRelations = Prisma.OrderGetPayload<{ include: ReturnType<typeof orderInclude> }>;

interface AddOnSnapshot {
  name: string;
  price: string;
}

function toItem(item: OrderWithRelations['items'][number]): OrderItemProfile {
  return {
    id: item.id,
    orderId: item.orderId,
    menuItemId: item.menuItemId,
    name: item.name,
    variationName: item.variationName,
    addOns: item.addOns as AddOnSnapshot[] | null,
    quantity: item.quantity,
    unitPrice: item.unitPrice.toString(),
    lineTotal: item.lineTotal.toString(),
    discountAmount: item.discountAmount.toString(),
    taxAmount: item.taxAmount.toString(),
    notes: item.notes,
    createdAt: item.createdAt.toISOString(),
  };
}

function toOrder(order: OrderWithRelations): OrderProfile {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    orderType: order.orderType,
    status: order.status,
    paymentStatus: order.paymentStatus,
    customerId: order.customerId,
    customerName: order.customer?.name ?? null,
    tableId: order.tableId,
    tableNumber: order.table?.tableNumber ?? null,
    tableName: order.table?.name ?? null,
    userId: order.userId,
    userName: order.user.name,
    subtotal: order.subtotal.toString(),
    itemDiscountTotal: order.itemDiscountTotal.toString(),
    discountAmount: order.discountAmount.toString(),
    taxAmount: order.taxAmount.toString(),
    serviceChargeAmount: order.serviceChargeAmount.toString(),
    grandTotal: order.grandTotal.toString(),
    totalPaid: order.totalPaid.toString(),
    balanceDue: order.balanceDue.toString(),
    notes: order.notes,
    kitchenNotes: order.kitchenNotes,
    cancelledReason: order.cancelledReason,
    completedAt: order.completedAt?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map(toItem),
  };
}

async function requireOrder(id: string): Promise<OrderWithRelations> {
  const order = await prisma.order.findUnique({ where: { id }, include: orderInclude() });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  return order;
}

async function getSettings() {
  const settings = await prisma.restaurantSettings.findFirst();
  if (!settings) {
    throw new ApiError(500, 'Restaurant settings are not configured');
  }
  return settings;
}

async function nextOrderNumber(prefix: string, fallbackStart: number): Promise<string> {
  const last = await prisma.order.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { createdAt: 'desc' },
    select: { orderNumber: true },
  });
  let sequence = fallbackStart;
  if (last) {
    const trailing = Number(last.orderNumber.slice(prefix.length));
    if (Number.isFinite(trailing)) {
      sequence = Math.max(sequence, trailing + 1);
    }
  }
  return `${prefix}${String(sequence).padStart(6, '0')}`;
}

// ---- Item resolution & pricing -------------------------------

interface ResolvedLine {
  menuItemId: string;
  name: string;
  variationName: string | null;
  addOns: AddOnSnapshot[];
  quantity: number;
  unitPriceCents: number;
  lineTotalCents: number;
  taxRate: string;
  taxAmountCents: number;
  notes: string | null;
}

async function resolveLines(inputs: CreateOrderItemInput[]): Promise<ResolvedLine[]> {
  const ids = [...new Set(inputs.map((item) => item.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: ids } },
    include: { variations: true, addOns: true },
  });
  const byId = new Map(menuItems.map((item) => [item.id, item]));

  return inputs.map((input) => {
    const menuItem = byId.get(input.menuItemId);
    if (!menuItem) {
      throw ApiError.notFound(`Menu item not found: ${input.menuItemId}`);
    }
    if (menuItem.status !== 'ACTIVE' || !menuItem.available) {
      throw ApiError.conflict(`${menuItem.name} is not available for ordering.`);
    }

    let variationName: string | null = null;
    let unitPriceCents = toCents(menuItem.price.toString());
    if (input.variationId) {
      const variation = menuItem.variations.find((candidate) => candidate.id === input.variationId);
      if (!variation) {
        throw ApiError.badRequest('The selected variation does not belong to this item.');
      }
      variationName = variation.name;
      unitPriceCents += toCents(variation.priceAdjustment.toString());
    }

    const addOns: AddOnSnapshot[] = [];
    for (const addOnId of input.addOnIds ?? []) {
      const addOn = menuItem.addOns.find((candidate) => candidate.id === addOnId);
      if (!addOn) {
        throw ApiError.badRequest('A selected add-on does not belong to this item.');
      }
      if (!addOn.available) {
        throw ApiError.conflict(`The add-on "${addOn.name}" is not available.`);
      }
      addOns.push({ name: addOn.name, price: fromCents(toCents(addOn.price.toString())) });
    }

    const quantity = input.quantity ?? 1;
    const perUnitCents = unitPriceCents + addOns.reduce((sum, addOn) => sum + toCents(addOn.price), 0);
    const lineTotalCents = perUnitCents * quantity;
    const taxAmountCents = percentOf(lineTotalCents, menuItem.taxRate.toString());

    return {
      menuItemId: menuItem.id,
      name: menuItem.name,
      variationName,
      addOns,
      quantity,
      unitPriceCents,
      lineTotalCents,
      taxRate: menuItem.taxRate.toString(),
      taxAmountCents,
      notes: input.notes ?? null,
    };
  });
}

function buildTotals(
  lines: ResolvedLine[],
  existingLines: { lineTotal: { toString(): string }; taxAmount: { toString(): string } }[],
) {
  let subtotalCents = 0;
  let taxCents = 0;
  for (const line of existingLines) {
    subtotalCents += toCents(line.lineTotal.toString());
    taxCents += toCents(line.taxAmount.toString());
  }
  for (const line of lines) {
    subtotalCents += line.lineTotalCents;
    taxCents += line.taxAmountCents;
  }
  return { subtotalCents, taxCents };
}

function orderTotals(
  subtotalCents: number,
  taxCents: number,
  orderLevelDiscount: string | undefined,
  serviceChargePct: string,
  orderType: Order['orderType'],
) {
  const discountCents = orderLevelDiscount ? toCents(orderLevelDiscount) : 0;
  const serviceChargeCents = orderType === 'DINE_IN' ? percentOf(subtotalCents, serviceChargePct) : 0;
  const grandTotalCents = subtotalCents - discountCents + taxCents + serviceChargeCents;
  return {
    discountCents,
    serviceChargeCents,
    grandTotalCents: Math.max(0, grandTotalCents),
  };
}

// ---- Create --------------------------------------------------

export async function createOrder(
  userId: string,
  input: CreateOrderInput,
): Promise<OrderProfile> {
  const orderType = input.orderType ?? 'DINE_IN';
  if (input.tableId && orderType !== 'DINE_IN') {
    throw ApiError.badRequest('A table can only be assigned to a DINE_IN order.');
  }
  if (input.tableId) {
    const table = await prisma.restaurantTable.findUnique({ where: { id: input.tableId } });
    if (!table) {
      throw ApiError.notFound('Table not found');
    }
  }
  if (input.customerId) {
    const customer = await prisma.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }
  }

  const settings = await getSettings();
  const lines = await resolveLines(input.items);
  const { subtotalCents, taxCents } = buildTotals(lines, []);
  const { discountCents, serviceChargeCents, grandTotalCents } = orderTotals(
    subtotalCents,
    taxCents,
    input.discountAmount,
    settings.serviceChargePct.toString(),
    orderType,
  );

  let attempt = 0;
  while (attempt < 3) {
    attempt += 1;
    const orderNumber = await nextOrderNumber(settings.orderNumberPrefix, settings.orderNumberStart);
    try {
      const order = await prisma.$transaction(async (tx) => {
        const created = await tx.order.create({
          data: {
            orderNumber,
            orderType,
            status: OrderStatus.PENDING,
            userId,
            tableId: input.tableId ?? null,
            customerId: input.customerId ?? null,
            notes: input.notes ?? null,
            kitchenNotes: input.kitchenNotes ?? null,
            subtotal: fromCents(subtotalCents),
            itemDiscountTotal: '0',
            discountAmount: fromCents(discountCents),
            taxAmount: fromCents(taxCents),
            serviceChargeAmount: fromCents(serviceChargeCents),
            grandTotal: fromCents(grandTotalCents),
            totalPaid: '0',
            balanceDue: fromCents(grandTotalCents),
            items: {
              create: lines.map((line) => ({
                menuItemId: line.menuItemId,
                name: line.name,
                variationName: line.variationName,
                addOns: line.addOns.length ? (line.addOns as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
                quantity: line.quantity,
                unitPrice: fromCents(line.unitPriceCents),
                lineTotal: fromCents(line.lineTotalCents),
                discountAmount: '0',
                taxAmount: fromCents(line.taxAmountCents),
                notes: line.notes,
              })),
            },
          },
          include: orderInclude(),
        });
        if (created.tableId) {
          await tx.restaurantTable.update({
            where: { id: created.tableId },
            data: { status: 'OCCUPIED' },
          });
        }
        return created;
      });
      realtime.orderUpdated({ orderId: order.id });
      if (order.tableId) {
        realtime.tableUpdated({ tableId: order.tableId });
      }
      return toOrder(order);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        continue;
      }
      throw error;
    }
  }
  throw ApiError.conflict('Could not allocate an order number. Please try again.');
}

// ---- Read ----------------------------------------------------

export async function listOrders(params: ListOrdersQuery): Promise<Paginated<OrderProfile>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const where: Prisma.OrderWhereInput = {};
  if (params.status) where.status = params.status;
  if (params.paymentStatus) where.paymentStatus = params.paymentStatus;
  if (params.orderType) where.orderType = params.orderType;
  if (params.search) {
    where.OR = [
      { orderNumber: { contains: params.search, mode: 'insensitive' } },
      { table: { tableNumber: { equals: parseInt(params.search, 10) || -1 } } },
      { customer: { name: { contains: params.search, mode: 'insensitive' } } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: orderInclude(),
    }),
  ]);

  return {
    items: rows.map((order) => ({ ...toOrder(order), items: [] })),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getOrder(id: string): Promise<OrderProfile> {
  return toOrder(await requireOrder(id));
}

// ---- Update --------------------------------------------------

export async function updateOrder(id: string, input: UpdateOrderInput): Promise<OrderProfile> {
  await requireOrder(id);
  if (input.tableId && input.orderType && input.orderType !== 'DINE_IN') {
    throw ApiError.badRequest('A table can only be assigned to a DINE_IN order.');
  }
  const order = await prisma.order.update({
    where: { id },
    data: {
      notes: input.notes ?? undefined,
      kitchenNotes: input.kitchenNotes ?? undefined,
      customerId: input.customerId ?? undefined,
      tableId: input.tableId ?? undefined,
      orderType: input.orderType,
    },
    include: orderInclude(),
  });
  realtime.orderUpdated({ orderId: id });
  return toOrder(order);
}

// ---- Items ---------------------------------------------------

async function recalcTotals(orderId: string) {
  const existing = await prisma.orderItem.findMany({
    where: { orderId },
    select: { lineTotal: true, taxAmount: true },
  });
  const { subtotalCents, taxCents } = buildTotals([], existing);
  const settings = await getSettings();
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  const storedDiscount = order.discountAmount.toString();
  const discount = storedDiscount === '0' || storedDiscount === '0.00' ? undefined : storedDiscount;
  const totals = orderTotals(subtotalCents, taxCents, discount, settings.serviceChargePct.toString(), order.orderType);
  return prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal: fromCents(subtotalCents),
      taxAmount: fromCents(taxCents),
      serviceChargeAmount: fromCents(totals.serviceChargeCents),
      grandTotal: fromCents(totals.grandTotalCents),
      balanceDue: fromCents(totals.grandTotalCents),
    },
    include: orderInclude(),
  });
}

export async function addItems(id: string, input: AddOrderItemsInput): Promise<OrderProfile> {
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) throw ApiError.notFound('Order not found');
  if (!ALLOW_ITEM_EDITS.includes(order.status)) {
    throw ApiError.conflict('Items can only be added while the order is PENDING or CONFIRMED.');
  }
  const lines = await resolveLines(input.items);
  let kitchenTicketId: string | undefined;
  await prisma.$transaction(async (tx) => {
    const orderItems: { id: string }[] = [];
    for (const line of lines) {
      const createdItem = await tx.orderItem.create({
        data: {
          orderId: id,
          menuItemId: line.menuItemId,
          name: line.name,
          variationName: line.variationName,
          addOns: line.addOns.length ? (line.addOns as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
          quantity: line.quantity,
          unitPrice: fromCents(line.unitPriceCents),
          lineTotal: fromCents(line.lineTotalCents),
          discountAmount: '0',
          taxAmount: fromCents(line.taxAmountCents),
          notes: line.notes,
        },
      });
      orderItems.push(createdItem);
    }
    // Items added to a confirmed order reach the kitchen: append to the open
    // ticket if one exists, otherwise mint a fresh ticket (module 7).
    if (order.status === 'CONFIRMED') {
      const openTicket = await tx.kitchenOrder.findFirst({
        where: { orderId: id, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        orderBy: { createdAt: 'asc' },
      });
      if (openTicket) {
        await tx.kitchenOrderItem.createMany({
          data: lines.map((line, index) => ({
            kitchenOrderId: openTicket.id,
            orderItemId: orderItems[index].id,
            menuItemId: line.menuItemId,
            name: line.name,
            quantity: line.quantity,
            notes: line.notes,
            variant: line.variationName,
          })),
        });
        kitchenTicketId = openTicket.id;
      } else {
        const previousTickets = await tx.kitchenOrder.count({ where: { orderId: id } });
        const ticket = await tx.kitchenOrder.create({
          data: {
            orderId: id,
            notes: order.kitchenNotes,
            ticketNumber: previousTickets + 1,
            items: {
              create: lines.map((line, index) => ({
                orderItemId: orderItems[index].id,
                menuItemId: line.menuItemId,
                name: line.name,
                quantity: line.quantity,
                notes: line.notes,
                variant: line.variationName,
              })),
            },
          },
        });
        kitchenTicketId = ticket.id;
      }
    }
  });
  realtime.orderUpdated({ orderId: id });
  if (order.status === 'CONFIRMED' && kitchenTicketId) {
    realtime.kitchenUpdated({ kitchenOrderId: kitchenTicketId, orderId: id });
  }
  return toOrder(await recalcTotals(id));
}

export async function removeItem(orderId: string, itemId: string): Promise<OrderProfile> {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound('Order not found');
  if (!ALLOW_ITEM_EDITS.includes(order.status)) {
    throw ApiError.conflict('Items can only be removed while the order is PENDING or CONFIRMED.');
  }
  const item = await prisma.orderItem.findFirst({ where: { id: itemId, orderId } });
  if (!item) throw ApiError.notFound('Order item not found');
  await prisma.orderItem.delete({ where: { id: itemId } });
  realtime.orderUpdated({ orderId });
  if (order.status === 'CONFIRMED') {
    realtime.kitchenUpdated({ orderId });
  }
  return toOrder(await recalcTotals(orderId));
}

// ---- Status --------------------------------------------------

export async function updateStatus(
  id: string,
  input: UpdateOrderStatusInput,
): Promise<OrderProfile> {
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order) throw ApiError.notFound('Order not found');

  if (input.status === order.status) {
    return toOrder(await requireOrder(id));
  }
  const allowed = STATUS_TRANSITIONS[order.status];
  if (!allowed.includes(input.status)) {
    throw ApiError.conflict(`Cannot move an order from ${order.status} to ${input.status}.`);
  }
  if (input.status === 'CANCELLED' && !input.cancelledReason) {
    throw ApiError.badRequest('A reason is required to cancel an order.');
  }

  let ticketCreated = false;
  const updated = await prisma.$transaction(async (tx) => {
    const now = new Date();
    const next = await tx.order.update({
      where: { id },
      data: {
        status: input.status,
        cancelledReason: input.status === 'CANCELLED' ? input.cancelledReason ?? null : order.cancelledReason,
        completedAt: input.status === 'COMPLETED' ? now : order.completedAt,
      },
      include: orderInclude(),
    });

    // Confirming an order releases the kitchen ticket (module 7).
    if (input.status === 'CONFIRMED') {
      const existingTickets = await tx.kitchenOrder.count({ where: { orderId: id } });
      if (existingTickets === 0) {
        await tx.kitchenOrder.create({
          data: {
            orderId: id,
            notes: order.kitchenNotes,
            items: {
              create: order.items.map((item) => ({
                orderItemId: item.id,
                menuItemId: item.menuItemId,
                name: item.name,
                quantity: item.quantity,
                notes: item.notes,
                variant: item.variationName,
              })),
            },
          },
        });
        ticketCreated = true;
      }
    }

    if (input.status === 'COMPLETED' && next.tableId) {
      await tx.restaurantTable.update({
        where: { id: next.tableId },
        data: { status: 'CLEANING' },
      });
      if (next.customerId) {
        const customer = await tx.customer.findUnique({ where: { id: next.customerId } });
        if (customer) {
          await tx.customer.update({
            where: { id: customer.id },
            data: {
              totalOrders: customer.totalOrders + 1,
              totalSpending: (parseFloat(customer.totalSpending.toString()) + parseFloat(next.grandTotal.toString())).toFixed(2),
            },
          });
        }
      }
    }

    if (input.status === 'CANCELLED' && next.tableId) {
      const openOrders = await tx.order.count({
        where: { tableId: next.tableId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
      });
      if (openOrders === 0) {
        await tx.restaurantTable.update({
          where: { id: next.tableId },
          data: { status: 'AVAILABLE' },
        });
      }
    }

    return next;
  });

  if (input.status === 'CONFIRMED' && ticketCreated) {
    realtime.kitchenCreated({ orderId: id });
  }
  realtime.orderUpdated({ orderId: id });
  if (input.status === 'COMPLETED' || input.status === 'CANCELLED') {
    realtime.tableUpdated(updated.tableId ? { tableId: updated.tableId } : {});
    realtime.customerUpdated(updated.customerId ? { customerId: updated.customerId } : {});
  }

  return toOrder(updated);
}