import type {
  CreateCustomerInput,
  CustomerProfile,
  ListCustomersQuery,
  Paginated,
  UpdateCustomerInput,
} from '@restaurant/shared';
import { Prisma, type Customer } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

function toCustomer(customer: Customer): CustomerProfile {
  return {
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    notes: customer.notes,
    totalOrders: customer.totalOrders,
    totalSpending: customer.totalSpending.toString(),
    createdAt: customer.createdAt.toISOString(),
    updatedAt: customer.updatedAt.toISOString(),
  };
}

export async function listCustomers(params: ListCustomersQuery): Promise<Paginated<CustomerProfile>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const where: Prisma.CustomerWhereInput = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { phone: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
    ];
  }

  const [total, rows] = await prisma.$transaction([
    prisma.customer.count({ where }),
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return {
    items: rows.map(toCustomer),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

async function requireCustomer(id: string): Promise<Customer> {
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) {
    throw ApiError.notFound('Customer not found');
  }
  return customer;
}

export async function getCustomer(id: string): Promise<CustomerProfile> {
  const customer = await requireCustomer(id);
  return toCustomer(customer);
}

export async function createCustomer(input: CreateCustomerInput): Promise<CustomerProfile> {
  const customer = await prisma.customer.create({
    data: {
      name: input.name,
      phone: input.phone ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      notes: input.notes ?? null,
    },
  });
  return toCustomer(customer);
}

export async function updateCustomer(
  id: string,
  input: UpdateCustomerInput,
): Promise<CustomerProfile> {
  await requireCustomer(id);
  const customer = await prisma.customer.update({ where: { id }, data: input });
  return toCustomer(customer);
}

export async function deleteCustomer(id: string): Promise<void> {
  await requireCustomer(id);
  await prisma.customer.delete({ where: { id } });
}