import type {
  CreateSupplierInput,
  ListSuppliersQuery,
  Paginated,
  SupplierProfile,
  UpdateSupplierInput,
} from '@restaurant/shared';
import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

type SupplierWithCount = Prisma.SupplierGetPayload<{
  include: { _count: { select: { purchases: true } } };
}>;

function toSupplier(supplier: SupplierWithCount): SupplierProfile {
  return {
    id: supplier.id,
    name: supplier.name,
    company: supplier.company,
    phone: supplier.phone,
    email: supplier.email,
    address: supplier.address,
    notes: supplier.notes,
    purchaseCount: supplier._count.purchases,
    createdAt: supplier.createdAt.toISOString(),
    updatedAt: supplier.updatedAt.toISOString(),
  };
}

const supplierInclude = () =>
  ({
    _count: { select: { purchases: true } },
  }) as const;

async function requireSupplier(id: string): Promise<SupplierWithCount> {
  const supplier = await prisma.supplier.findUnique({ where: { id }, include: supplierInclude() });
  if (!supplier) {
    throw ApiError.notFound('Supplier not found');
  }
  return supplier;
}

export async function listSuppliers(params: ListSuppliersQuery): Promise<Paginated<SupplierProfile>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const where: Prisma.SupplierWhereInput = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { company: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.supplier.count({ where }),
    prisma.supplier.findMany({
      where,
      orderBy: [{ name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: supplierInclude(),
    }),
  ]);

  return { items: rows.map(toSupplier), page, limit, total, totalPages: Math.ceil(total / limit) };
}

export async function getSupplier(id: string): Promise<SupplierProfile> {
  return toSupplier(await requireSupplier(id));
}

export async function createSupplier(input: CreateSupplierInput): Promise<SupplierProfile> {
  const created = await prisma.supplier.create({
    data: {
      name: input.name,
      company: input.company ?? null,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
    },
    include: supplierInclude(),
  });
  return toSupplier(created);
}

export async function updateSupplier(id: string, input: UpdateSupplierInput): Promise<SupplierProfile> {
  await requireSupplier(id);
  const updated = await prisma.supplier.update({
    where: { id },
    data: {
      name: input.name,
      company: input.company === undefined ? undefined : input.company,
      phone: input.phone === undefined ? undefined : input.phone,
      email: input.email === undefined ? undefined : input.email,
      address: input.address === undefined ? undefined : input.address,
      notes: input.notes === undefined ? undefined : input.notes,
    },
    include: supplierInclude(),
  });
  return toSupplier(updated);
}

export async function deleteSupplier(id: string): Promise<void> {
  const supplier = await requireSupplier(id);
  if (supplier._count.purchases > 0) {
    throw ApiError.conflict('Supplier has purchase history and cannot be deleted');
  }
  await prisma.supplier.delete({ where: { id } });
}