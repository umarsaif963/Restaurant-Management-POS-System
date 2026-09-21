import type {
  CreateTableInput,
  CreateTableSectionInput,
  ListTablesQuery,
  RestaurantTableProfile,
  TableSectionProfile,
  UpdateTableInput,
  UpdateTableSectionInput,
} from '@restaurant/shared';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

type TableWithSection = NonNullable<Prisma.RestaurantTableGetPayload<{
  include: { section: { select: { name: true } } };
}>>;

function toTable(table: TableWithSection): RestaurantTableProfile {
  return {
    id: table.id,
    tableNumber: table.tableNumber,
    name: table.name,
    capacity: table.capacity,
    sectionId: table.sectionId,
    sectionName: table.section?.name ?? null,
    status: table.status,
    qrCodeUrl: table.qrCodeUrl,
  };
}

// ---- Table sections ------------------------------------------

export async function listSections(): Promise<TableSectionProfile[]> {
  const sections = await prisma.tableSection.findMany({
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { tables: true } } },
  });
  return sections.map((section) => ({
    id: section.id,
    name: section.name,
    position: section.position,
    tableCount: section._count.tables,
  }));
}

async function requireSection(id: string): Promise<void> {
  const section = await prisma.tableSection.findUnique({ where: { id } });
  if (!section) {
    throw ApiError.notFound('Table section not found');
  }
}

async function toSection(
  id: string,
  name: string,
  position: number,
): Promise<TableSectionProfile> {
  const tableCount = await prisma.restaurantTable.count({ where: { sectionId: id } });
  return { id, name, position, tableCount };
}

export async function createSection(input: CreateTableSectionInput): Promise<TableSectionProfile> {
  const section = await prisma.tableSection.create({
    data: { name: input.name, position: input.position ?? 0 },
  });
  return toSection(section.id, section.name, section.position);
}

export async function updateSection(
  id: string,
  input: UpdateTableSectionInput,
): Promise<TableSectionProfile> {
  await requireSection(id);
  const section = await prisma.tableSection.update({ where: { id }, data: input });
  return toSection(section.id, section.name, section.position);
}

export async function deleteSection(id: string): Promise<void> {
  await requireSection(id);
  const tableCount = await prisma.restaurantTable.count({ where: { sectionId: id } });
  if (tableCount > 0) {
    throw ApiError.conflict(
      `Cannot delete a section that still contains ${tableCount} table(s). Move or delete them first.`,
    );
  }
  await prisma.tableSection.delete({ where: { id } });
}

// ---- Tables ---------------------------------------------------

export async function listTables(query: ListTablesQuery): Promise<RestaurantTableProfile[]> {
  const where: Prisma.RestaurantTableWhereInput = {};
  if (query.status) {
    where.status = query.status;
  }
  if (query.sectionId) {
    where.sectionId = query.sectionId;
  }

  const tables = await prisma.restaurantTable.findMany({
    where,
    orderBy: { tableNumber: 'asc' },
    include: { section: { select: { name: true } } },
  });
  return tables.map(toTable);
}

async function requireTable(id: string): Promise<void> {
  const table = await prisma.restaurantTable.findUnique({ where: { id } });
  if (!table) {
    throw ApiError.notFound('Table not found');
  }
}

export async function createTable(input: CreateTableInput): Promise<RestaurantTableProfile> {
  const table = await prisma.restaurantTable.create({
    data: {
      tableNumber: input.tableNumber,
      name: input.name ?? null,
      capacity: input.capacity ?? 2,
      sectionId: input.sectionId ?? null,
    },
    include: { section: { select: { name: true } } },
  });
  return toTable(table);
}

export async function updateTable(
  id: string,
  input: UpdateTableInput,
): Promise<RestaurantTableProfile> {
  await requireTable(id);
  const table = await prisma.restaurantTable.update({
    where: { id },
    data: input,
    include: { section: { select: { name: true } } },
  });
  return toTable(table);
}

export async function deleteTable(id: string): Promise<void> {
  await requireTable(id);
  const orderCount = await prisma.order.count({ where: { tableId: id } });
  if (orderCount > 0) {
    throw ApiError.conflict('This table has order history and cannot be deleted.');
  }
  await prisma.restaurantTable.delete({ where: { id } });
}