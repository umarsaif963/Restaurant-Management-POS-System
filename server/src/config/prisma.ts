import { Prisma, PrismaClient } from '@prisma/client';
import { env } from './env.js';
import { ApiError } from '../utils/ApiError.js';
import { getScope } from './tenant-context.js';

declare global {
  var __prisma: PrismaClient | undefined;
}

/**
 * Reuse the same PrismaClient across hot-reloads in development to avoid
 * exhausting database connections.
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    datasources: env.DATABASE_URL ? { db: { url: env.DATABASE_URL } } : undefined,
  });
}

const baseClient = globalThis.__prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = baseClient;
}

/**
 * Models that belong to exactly one restaurant. Every read and write against
 * them is filtered by the request's tenant.
 */
const TENANT_OWNED_MODELS = new Set([
  'RestaurantSettings',
  'TableSection',
  'RestaurantTable',
  'Customer',
  'MenuCategory',
  'MenuItem',
  'MenuItemVariation',
  'AddOn',
  'Order',
  'OrderItem',
  'Payment',
  'KitchenOrder',
  'KitchenOrderItem',
  'Reservation',
  'InventoryItem',
  'InventoryTransaction',
  'Recipe',
  'RecipeIngredient',
  'Supplier',
  'Purchase',
  'PurchaseItem',
  'Role',
]);

/**
 * Models that may exist without a tenant: the platform super admin has no
 * restaurant, and platform-level audit entries are not tied to a venue.
 * Inside a restaurant workspace they are filtered by the tenant as usual.
 */
const TENANT_OPTIONAL_MODELS = new Set(['User', 'AuditLog']);

/**
 * Models that are never tenant-scoped. The marketing contact inbox is global
 * and is only accessible to the platform operator through dedicated routes.
 */
const UNSCOPED_MODELS = new Set(['ContactMessage']);

/**
 * The tenant row itself. It is scoped by its own primary key rather than by a
 * `restaurantId` column, because it is the record the column points at.
 */
const SELF_SCOPED_MODELS = new Set(['Restaurant']);

/** Operations that filter rows. */
const FILTERED_OPERATIONS = new Set([
  'findUnique',
  'findUniqueOrThrow',
  'findFirst',
  'findFirstOrThrow',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
  'update',
  'updateMany',
  'delete',
  'deleteMany',
  'upsert',
]);

/** Operations that create rows. */
const CREATING_OPERATIONS = new Set(['create', 'createMany', 'createManyAndReturn']);

interface OperationArgs {
  where?: Record<string, unknown>;
  data?: Record<string, unknown> | Record<string, unknown>[];
  create?: Record<string, unknown>;
  update?: Record<string, unknown>;
}

function crossTenant(): ApiError {
  return ApiError.forbidden('This record belongs to a different restaurant');
}

/**
 * Adds the tenant key to a filter. An explicit filter for another restaurant
 * is a cross-tenant attempt and is rejected outright.
 */
function scopeWhere(args: OperationArgs, restaurantId: string): void {
  const where = args.where;
  if (where && typeof where === 'object' && 'restaurantId' in where) {
    if (where.restaurantId !== restaurantId && where.restaurantId !== undefined) {
      throw crossTenant();
    }
  }
  args.where = { ...(where ?? {}), restaurantId };
}

/**
 * Scopes the tenant row itself. A caller that names a different restaurant id
 * is rejected instead of being silently redirected to the caller's own row.
 */
function scopeSelf(args: OperationArgs, restaurantId: string): void {
  const where = args.where;
  if (where && typeof where === 'object' && 'id' in where) {
    if (where.id !== restaurantId && where.id !== undefined) {
      throw crossTenant();
    }
  }
  args.where = { ...(where ?? {}), id: restaurantId };
}

/** Adds the tenant key to a write payload. */
function scopeData(
  data: Record<string, unknown> | Record<string, unknown>[] | undefined,
  restaurantId: string,
): Record<string, unknown> | Record<string, unknown>[] | undefined {
  if (Array.isArray(data)) {
    return data.map((row) => {
      if ('restaurantId' in row && row.restaurantId !== restaurantId) {
        throw crossTenant();
      }
      return { ...row, restaurantId };
    });
  }
  if (data && typeof data === 'object') {
    if ('restaurantId' in data && data.restaurantId !== restaurantId) {
      throw crossTenant();
    }
    return { ...data, restaurantId };
  }
  return data;
}

/**
 * Tenant-scoping extension.
 *
 * Every model operation is intercepted and the request's restaurant is added
 * to the filter (reads, updates, deletes) or to the payload (creates). A
 * caller can therefore never read, modify or delete another restaurant's
 * record by changing an id, a query parameter or a request body: the tenant
 * key is taken from the authenticated session, never from the request.
 */
const tenantScopeExtension = Prisma.defineExtension((client) =>
  client.$extends({
    name: 'tenant-scope',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const scope = getScope();

          const self = SELF_SCOPED_MODELS.has(model);
          const owned = TENANT_OWNED_MODELS.has(model);
          const optional = TENANT_OPTIONAL_MODELS.has(model);
          const unscoped = UNSCOPED_MODELS.has(model);

          if (unscoped) {
            return query(args);
          }

          if (!self && !owned && !optional) {
            return query(args);
          }

          if (!scope || scope.kind === 'system') {
            // Sign-in, registration and password reset run before a tenant is
            // known. Tenant-owned records may not be touched in that state.
            if (owned) {
              throw ApiError.forbidden(
                'This operation requires an authenticated restaurant context',
              );
            }
            return query(args);
          }

          if (scope.kind === 'platform') {
            // The platform operator may read across restaurants.
            return query(args);
          }

          const restaurantId = scope.restaurantId;
          const next = args as OperationArgs;

          if (self) {
            if (CREATING_OPERATIONS.has(operation)) {
              throw ApiError.forbidden('A restaurant cannot be created from inside a workspace');
            }
            if (FILTERED_OPERATIONS.has(operation)) {
              scopeSelf(next, restaurantId);
            }
            return query(next as never);
          }

          if (FILTERED_OPERATIONS.has(operation)) {
            scopeWhere(next, restaurantId);
          }
          if (CREATING_OPERATIONS.has(operation)) {
            next.data = scopeData(next.data, restaurantId);
          }
          if (operation === 'upsert') {
            next.create = scopeData(next.create, restaurantId) as Record<string, unknown>;
            next.update = scopeData(next.update, restaurantId) as Record<string, unknown>;
          }

          return query(next as never);
        },
      },
    },
  }),
);

/**
 * The application database client. Reads and writes are automatically scoped
 * to the restaurant of the current request.
 */
export const prisma = baseClient.$extends(tenantScopeExtension) as unknown as PrismaClient;

/**
 * Budget for interactive `prisma.$transaction(async (tx) => ...)` calls.
 *
 * Prisma's default `timeout` is 5s, which is shorter than one cold round-trip
 * to a scale-to-zero database (Neon suspends its compute when idle, so the
 * first query after a pause can take 8-20s). When the budget expires Prisma
 * closes the transaction, and the next `tx.*` call in the callback throws
 * P2028 "Transaction already closed" / "Transaction not found" - the write
 * that was already in flight is rolled back with it.
 *
 * `maxWait` covers waiting for a free pool connection, which is likewise
 * unbounded while the pool refills after a cold start.
 *
 * Pass this to every interactive transaction that performs more than a single
 * write, so one slow round-trip cannot tear a multi-step write apart.
 */
export const TRANSACTION_OPTIONS = { maxWait: 30_000, timeout: 60_000 } as const;
