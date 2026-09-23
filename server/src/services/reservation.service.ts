import type {
  ChangeReservationStatusInput,
  CreateReservationInput,
  ListReservationsQuery,
  Paginated,
  ReservationProfile,
  ReservationStatus,
  UpdateReservationInput,
} from '@restaurant/shared';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { RESERVATION_WINDOW_HOURS } from '../validators/reservation.schema.js';

type ReservationWithRelations = Prisma.ReservationGetPayload<{
  include: {
    customer: { select: { email: true } };
    table: { select: { tableNumber: true; name: true; capacity: true } };
    createdBy: { select: { name: true } };
  };
}>;

const reservationInclude = () =>
  ({
    customer: { select: { email: true } },
    table: { select: { tableNumber: true, name: true, capacity: true } },
    createdBy: { select: { name: true } },
  }) as const;

function toReservation(reservation: ReservationWithRelations): ReservationProfile {
  return {
    id: reservation.id,
    customerName: reservation.customerName,
    phone: reservation.phone,
    customerId: reservation.customerId,
    customerEmail: reservation.customer?.email ?? null,
    tableId: reservation.tableId,
    tableNumber: reservation.table?.tableNumber ?? null,
    tableName: reservation.table?.name ?? null,
    capacity: reservation.table?.capacity ?? null,
    guests: reservation.guests,
    date: reservation.date.toISOString(),
    notes: reservation.notes,
    status: reservation.status,
    createdById: reservation.createdById,
    createdByName: reservation.createdBy?.name ?? null,
    createdAt: reservation.createdAt.toISOString(),
    updatedAt: reservation.updatedAt.toISOString(),
  };
}

const WINDOW_MS = RESERVATION_WINDOW_HOURS * 60 * 60 * 1000;

async function requireReservation(id: string): Promise<ReservationWithRelations> {
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: reservationInclude(),
  });
  if (!reservation) {
    throw ApiError.notFound('Reservation not found');
  }
  return reservation;
}

/**
 * Every reservation owns a two-hour window starting at its `date`. A table can
 * only be assigned if it physically exists, is free right now (not occupied or
 * being cleaned), fits the party, and has no other *active* reservation whose
 * window overlaps. Overlap ignores SEATED/COMPLETED/CANCELLED rows.
 */
async function assertAssignableTable(
  tx: Prisma.TransactionClient,
  tableId: string,
  date: Date,
  guests: number,
  excludeReservationId?: string,
): Promise<void> {
  const table = await tx.restaurantTable.findUnique({ where: { id: tableId } });
  if (!table) {
    throw ApiError.badRequest('Table not found');
  }
  if (table.status === 'OCCUPIED' || table.status === 'CLEANING') {
    throw ApiError.conflict(`Table ${table.tableNumber} is not available right now`);
  }
  if (guests > table.capacity) {
    throw ApiError.conflict(`Table ${table.tableNumber} seats up to ${table.capacity} guests`);
  }
  const end = new Date(date.getTime() + WINDOW_MS);
  const overlap = await tx.reservation.count({
    where: {
      tableId,
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
      status: { in: ['PENDING', 'CONFIRMED'] },
      date: { gt: new Date(date.getTime() - WINDOW_MS), lt: end },
    },
  });
  if (overlap > 0) {
    throw ApiError.conflict(`Table ${table.tableNumber} is already reserved around that time`);
  }
}

/**
 * Drop a table's RESERVED flag when the releasing reservation is the last
 * active holder. Tables that were already handed off to a dine-in order
 * (OCCUPIED) are intentionally left alone.
 */
async function releaseTableIfReserved(
  tx: Prisma.TransactionClient,
  tableId: string | null,
  excludeReservationId?: string,
): Promise<void> {
  if (!tableId) return;
  const table = await tx.restaurantTable.findUnique({
    where: { id: tableId },
    select: { id: true, status: true },
  });
  if (!table || table.status !== 'RESERVED') return;
  const otherActive = await tx.reservation.count({
    where: {
      tableId,
      status: { in: ['PENDING', 'CONFIRMED'] },
      id: excludeReservationId ? { not: excludeReservationId } : undefined,
    },
  });
  if (otherActive === 0) {
    await tx.restaurantTable.update({
      where: { id: tableId },
      data: { status: 'AVAILABLE' },
    });
  }
}

export async function listReservations(
  params: ListReservationsQuery,
): Promise<Paginated<ReservationProfile>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const where: Prisma.ReservationWhereInput = {};
  if (params.search) {
    where.OR = [
      { customerName: { contains: params.search, mode: 'insensitive' } },
      { phone: { contains: params.search, mode: 'insensitive' } },
      { customer: { email: { contains: params.search, mode: 'insensitive' } } },
    ];
  }
  if (params.status) {
    where.status = params.status;
  }
  if (params.from || params.to) {
    where.date = {
      ...(params.from ? { gte: new Date(params.from) } : {}),
      ...(params.to ? { lte: new Date(params.to) } : {}),
    };
  }

  const [total, rows] = await prisma.$transaction([
    prisma.reservation.count({ where }),
    prisma.reservation.findMany({
      where,
      orderBy: { date: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: reservationInclude(),
    }),
  ]);

  return { items: rows.map(toReservation), page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function getReservation(id: string): Promise<ReservationProfile> {
  return toReservation(await requireReservation(id));
}

export async function createReservation(
  input: CreateReservationInput,
  userId: string,
): Promise<ReservationProfile> {
  const date = new Date(input.date);
  if (input.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
      select: { id: true },
    });
    if (!customer) {
      throw ApiError.badRequest('Customer not found');
    }
  }

  return prisma.$transaction(async (tx) => {
    if (input.tableId) {
      await assertAssignableTable(tx, input.tableId, date, input.guests);
      await tx.restaurantTable.update({
        where: { id: input.tableId },
        data: { status: 'RESERVED' },
      });
    }
    const created = await tx.reservation.create({
      data: {
        customerName: input.customerName,
        phone: input.phone ?? null,
        customerId: input.customerId ?? null,
        tableId: input.tableId ?? null,
        guests: input.guests,
        date,
        notes: input.notes ?? null,
        status: 'PENDING',
        createdById: userId,
      },
      include: reservationInclude(),
    });
    return toReservation(created);
  });
}

export async function updateReservation(
  id: string,
  input: UpdateReservationInput,
): Promise<ReservationProfile> {
  const existing = await requireReservation(id);
  if (existing.status === 'SEATED' || existing.status === 'COMPLETED' || existing.status === 'CANCELLED') {
    throw ApiError.conflict(`Cannot edit a ${existing.status.toLowerCase()} reservation`);
  }
  if (input.customerId) {
    const customer = await prisma.customer.findUnique({
      where: { id: input.customerId },
      select: { id: true },
    });
    if (!customer) {
      throw ApiError.badRequest('Customer not found');
    }
  }

  const newTableId = input.tableId !== undefined ? input.tableId : existing.tableId;
  const newDate = input.date !== undefined ? new Date(input.date) : existing.date;
  const newGuests = input.guests ?? existing.guests;
  const assignmentChanged =
    input.tableId !== undefined || input.date !== undefined || input.guests !== undefined;

  return prisma.$transaction(async (tx) => {
    if (existing.tableId && input.tableId !== undefined && input.tableId !== existing.tableId) {
      await releaseTableIfReserved(tx, existing.tableId, id);
    }
    if (newTableId && assignmentChanged) {
      await assertAssignableTable(tx, newTableId, newDate, newGuests, id);
      await tx.restaurantTable.update({
        where: { id: newTableId },
        data: { status: 'RESERVED' },
      });
    }
    const updated = await tx.reservation.update({
      where: { id },
      data: {
        customerName: input.customerName === undefined ? undefined : input.customerName,
        phone: input.phone === undefined ? undefined : (input.phone ?? null),
        customerId: input.customerId === undefined ? undefined : (input.customerId ?? null),
        tableId: newTableId,
        guests: input.guests === undefined ? undefined : input.guests,
        date: input.date === undefined ? undefined : newDate,
        notes: input.notes === undefined ? undefined : (input.notes ?? null),
      },
      include: reservationInclude(),
    });
    return toReservation(updated);
  });
}

export async function deleteReservation(id: string): Promise<void> {
  const existing = await requireReservation(id);
  if (existing.status !== 'PENDING' && existing.status !== 'CANCELLED') {
    throw ApiError.conflict('Only pending or cancelled reservations can be deleted');
  }
  await prisma.$transaction(async (tx) => {
    await releaseTableIfReserved(tx, existing.tableId, id);
    await tx.reservation.delete({ where: { id } });
  });
}

const ALLOWED_NEXT: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ['CONFIRMED', 'SEATED', 'CANCELLED'],
  CONFIRMED: ['SEATED', 'CANCELLED'],
  SEATED: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [],
  CANCELLED: [],
};

/**
 * Drive the reservation state machine: PENDING → CONFIRMED → SEATED →
 * COMPLETED, with CANCELLED allowed from any pre-terminal state. Seating
 * physically takes the table (OCCUPIED); completion hands it to housekeeping
 * (CLEANING) when no dine-in order owns it; cancellation releases a still-
 * RESERVED table back to the pool.
 */
export async function changeReservationStatus(
  id: string,
  input: ChangeReservationStatusInput,
): Promise<ReservationProfile> {
  const existing = await requireReservation(id);
  const tableId = existing.tableId;
  const target = input.status;
  const allowed = ALLOWED_NEXT[existing.status];
  if (!allowed.includes(target)) {
    throw ApiError.conflict(
      `Cannot move a ${existing.status.toLowerCase()} reservation to ${target.toLowerCase()}`,
    );
  }

  if (target === 'CANCELLED') {
    return prisma.$transaction(async (tx) => {
      await releaseTableIfReserved(tx, tableId);
      const updated = await tx.reservation.update({
        where: { id },
        data: { status: 'CANCELLED' },
        include: reservationInclude(),
      });
      return toReservation(updated);
    });
  }

  if (target === 'CONFIRMED') {
    const updated = await prisma.reservation.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: reservationInclude(),
    });
    return toReservation(updated);
  }

  if (target === 'SEATED') {
    if (!tableId) {
      throw ApiError.badRequest('Assign a table before seating this reservation');
    }
    return prisma.$transaction(async (tx) => {
      await assertAssignableTable(tx, tableId, existing.date, existing.guests, id);
      await tx.restaurantTable.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' },
      });
      const updated = await tx.reservation.update({
        where: { id },
        data: { status: 'SEATED' },
        include: reservationInclude(),
      });
      return toReservation(updated);
    });
  }

  // COMPLETED
  return prisma.$transaction(async (tx) => {
    if (tableId) {
      const current = await tx.restaurantTable.findUnique({
        where: { id: tableId },
        select: { status: true },
      });
      if (current && current.status === 'OCCUPIED') {
        const openOrders = await tx.order.count({
          where: { tableId, status: { notIn: ['COMPLETED', 'CANCELLED'] } },
        });
        if (openOrders === 0) {
          await tx.restaurantTable.update({
            where: { id: tableId },
            data: { status: 'CLEANING' },
          });
        }
      }
    }
    const updated = await tx.reservation.update({
      where: { id },
      data: { status: 'COMPLETED' },
      include: reservationInclude(),
    });
    return toReservation(updated);
  });
}