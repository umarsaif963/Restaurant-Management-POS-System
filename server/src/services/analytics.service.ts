import type {
  AnalyticsRangeQuery,
  DashboardSummary,
  OrderAnalyticsReport,
  OrderStatusCount,
  PaymentMethodReport,
  PaymentMethodBreakdownItem,
  SalesReport,
  SalesByDayItem,
  TopItemsQuery,
  TopSellingReport,
  TopSellingItem,
} from '@restaurant/shared';
import { OrderStatus, OrderType, ReservationStatus, type PaymentMethod } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { fromCents, toCents } from '../utils/money.js';

const DAY_MS = 86_400_000;

function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function money(cents: number): string {
  return fromCents(cents);
}

/**
 * Resolves a query range into concrete Date bounds. `to` is exclusive; when a
 * bound is missing a default window (inclusive of today) is applied.
 */
function resolveRange(query: AnalyticsRangeQuery, defaultDays: number): { from: Date; to: Date } {
  const now = new Date();
  const to = query.to ? new Date(query.to) : addDays(startOfDayUtc(now), 1);
  const from = query.from ? new Date(query.from) : addDays(startOfDayUtc(now), -(defaultDays - 1));
  return { from, to };
}

// ---- Dashboard summary ------------------------------------------------

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const now = new Date();
  const dayStart = startOfDayUtc(now);
  const dayEnd = addDays(dayStart, 1);

  const openStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.SERVED];
  const activeReservations = [ReservationStatus.PENDING, ReservationStatus.CONFIRMED, ReservationStatus.SEATED];

  const [completedToday, ordersToday, openToday, paymentGroups, tableGroups, inventoryRows, reservationsToday, reservationsUpcoming] =
    await Promise.all([
      prisma.order.aggregate({
        where: { status: OrderStatus.COMPLETED, createdAt: { gte: dayStart, lt: dayEnd } },
        _count: { _all: true },
        _sum: { grandTotal: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: dayStart, lt: dayEnd }, status: { not: OrderStatus.CANCELLED } } }),
      prisma.order.count({ where: { createdAt: { gte: dayStart, lt: dayEnd }, status: { in: openStatuses } } }),
      prisma.payment.groupBy({
        by: ['isRefund'],
        where: { paidAt: { gte: dayStart, lt: dayEnd } },
        _count: { _all: true },
        _sum: { amount: true },
      }),
      prisma.restaurantTable.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.inventoryItem.findMany({ select: { quantity: true, minQuantity: true } }),
      prisma.reservation.count({
        where: { date: { gte: dayStart, lt: dayEnd }, status: { in: activeReservations } },
      }),
      prisma.reservation.count({
        where: { date: { gte: dayEnd }, status: { in: activeReservations } },
      }),
    ]);

  const revenueCents = toCents(completedToday._sum.grandTotal?.toString() ?? '0');
  const completedCount = completedToday._count._all;
  const averageOrderValue = completedCount > 0 ? (revenueCents / completedCount / 100).toFixed(2) : '0.00';

  let receivedCents = 0;
  let receivedCount = 0;
  for (const group of paymentGroups) {
    const cents = toCents(group._sum.amount?.toString() ?? '0');
    if (group.isRefund) {
      receivedCents -= cents;
    } else {
      receivedCents += cents;
      receivedCount += group._count._all;
    }
  }

  const statusMap = new Map(tableGroups.map((group) => [group.status, group._count._all]));
  const lowStock = inventoryRows.filter((row) => row.quantity.toNumber() > 0 && row.minQuantity.toNumber() > 0 && row.quantity.lte(row.minQuantity)).length;
  const outOfStock = inventoryRows.filter((row) => row.quantity.toNumber() <= 0).length;

  return {
    today: {
      revenue: money(revenueCents),
      orders: ordersToday,
      completedOrders: completedCount,
      averageOrderValue,
      openOrders: openToday,
    },
    tables: {
      total: tableGroups.reduce((sum, group) => sum + group._count._all, 0),
      available: statusMap.get('AVAILABLE') ?? 0,
      reserved: statusMap.get('RESERVED') ?? 0,
      occupied: statusMap.get('OCCUPIED') ?? 0,
      cleaning: statusMap.get('CLEANING') ?? 0,
    },
    inventory: { lowStock, outOfStock },
    reservations: { today: reservationsToday, upcoming: reservationsUpcoming },
    paymentsToday: { netReceived: money(receivedCents), count: receivedCount },
  };
}

// ---- Sales by day ----------------------------------------------------

export async function getSalesByDay(query: AnalyticsRangeQuery): Promise<SalesReport> {
  const { from, to } = resolveRange(query, 7);
  const completed = await prisma.order.findMany({
    where: { status: OrderStatus.COMPLETED, createdAt: { gte: from, lt: to } },
    select: { createdAt: true, grandTotal: true },
  });

  const byDay = new Map<string, { orders: number; revenueCents: number }>();
  for (const row of completed) {
    const key = dayKey(row.createdAt);
    const bucket = byDay.get(key) ?? { orders: 0, revenueCents: 0 };
    bucket.orders += 1;
    bucket.revenueCents += toCents(row.grandTotal.toString());
    byDay.set(key, bucket);
  }

  const lastInclusiveDay = dayKey(new Date(to.getTime() - 1));
  const items: SalesByDayItem[] = [];
  let cursor = addDays(startOfDayUtc(from), 0);
  while (dayKey(cursor) <= lastInclusiveDay) {
    const key = dayKey(cursor);
    const bucket = byDay.get(key) ?? { orders: 0, revenueCents: 0 };
    items.push({
      date: key,
      orders: bucket.orders,
      revenue: money(bucket.revenueCents),
      averageOrderValue: bucket.orders > 0 ? (bucket.revenueCents / bucket.orders / 100).toFixed(2) : '0.00',
    });
    cursor = addDays(cursor, 1);
  }

  return { from: dayKey(from), to: lastInclusiveDay, items };
}

// ---- Top selling items ----------------------------------------------

export async function getTopItems(query: TopItemsQuery): Promise<TopSellingReport> {
  const { from, to } = resolveRange(query, 30);
  const rows = await prisma.orderItem.findMany({
    where: { order: { status: OrderStatus.COMPLETED, createdAt: { gte: from, lt: to } } },
    select: { menuItemId: true, name: true, quantity: true, lineTotal: true, orderId: true },
  });

  const byItem = new Map<string, TopSellingItem>();
  const orderSets = new Map<string, Set<string>>();
  for (const row of rows) {
    const key = row.menuItemId;
    const current = byItem.get(key) ?? { menuItemId: row.menuItemId, name: row.name, quantity: 0, revenue: '0.00', orders: 0 };
    const cents = toCents(current.revenue);
    current.quantity += row.quantity;
    current.revenue = money(cents + toCents(row.lineTotal.toString()));
    byItem.set(key, current);
    const orderSet = orderSets.get(key) ?? new Set<string>();
    orderSet.add(row.orderId);
    orderSets.set(key, orderSet);
  }

  const items = [...byItem.entries()]
    .sort(
      (a, b) => toCents(b[1].revenue) - toCents(a[1].revenue) || b[1].quantity - a[1].quantity || a[1].name.localeCompare(b[1].name),
    )
    .slice(0, query.limit ?? 10)
    .map(([menuItemId, item]) => ({ ...item, orders: orderSets.get(menuItemId)?.size ?? 0 }));

  return { items };
}

// ---- Payment methods ------------------------------------------------

export async function getPaymentMethods(query: AnalyticsRangeQuery): Promise<PaymentMethodReport> {
  const { from, to } = resolveRange(query, 30);
  const groups = await prisma.payment.groupBy({
    by: ['method', 'isRefund'],
    where: { paidAt: { gte: from, lt: to } },
    _count: { _all: true },
    _sum: { amount: true },
  });

  const netByMethod = new Map<PaymentMethod, { amountCents: number; count: number }>();
  for (const group of groups) {
    const current = netByMethod.get(group.method) ?? { amountCents: 0, count: 0 };
    const cents = toCents(group._sum.amount?.toString() ?? '0');
    if (group.isRefund) {
      current.amountCents -= cents;
    } else {
      current.amountCents += cents;
      current.count += group._count._all;
    }
    netByMethod.set(group.method, current);
  }

  const items: PaymentMethodBreakdownItem[] = [...netByMethod.entries()]
    .sort((a, b) => b[1].amountCents - a[1].amountCents)
    .map(([method, totals]) => ({ method, amount: money(totals.amountCents), count: totals.count }));
  const totalCents = items.reduce((sum, item) => sum + toCents(item.amount), 0);

  return { total: money(totalCents), items };
}

// ---- Order status & type breakdown ----------------------------------

export async function getOrderBreakdown(query: AnalyticsRangeQuery): Promise<OrderAnalyticsReport> {
  const { from, to } = resolveRange(query, 30);
  const [statusGroups, typeGroups, completedTypeGroups] = await Promise.all([
    prisma.order.groupBy({ by: ['status'], where: { createdAt: { gte: from, lt: to } }, _count: { _all: true } }),
    prisma.order.groupBy({ by: ['orderType'], where: { createdAt: { gte: from, lt: to } }, _count: { _all: true } }),
    prisma.order.groupBy({
      by: ['orderType'],
      where: { status: OrderStatus.COMPLETED, createdAt: { gte: from, lt: to } },
      _sum: { grandTotal: true },
    }),
  ]);

  const revenueByType = new Map<string, number>();
  for (const group of completedTypeGroups) {
    revenueByType.set(group.orderType, toCents(group._sum.grandTotal?.toString() ?? '0'));
  }

  const statuses: OrderStatusCount[] = statusGroups
    .map((group) => ({ status: group.status, count: group._count._all }))
    .sort((a, b) => b.count - a.count);

  const types: OrderAnalyticsReport['types'] = typeGroups
    .map((group) => ({
      type: group.orderType as OrderType,
      count: group._count._all,
      revenue: money(revenueByType.get(group.orderType) ?? 0),
    }))
    .sort((a, b) => b.count - a.count);

  return { statuses, types };
}