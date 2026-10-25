import { describe, expect, it } from 'vitest';
import { prisma } from '../../src/config/prisma.js';
import { runWithScope } from '../../src/config/tenant-context.js';
import { ApiError } from '../../src/utils/ApiError.js';
import { createCustomer, createEmployee, createTenant } from '../helpers/factories.js';

/** Reads a row without a tenant filter, the way the platform operator sees it. */
function asPlatform<T>(fn: () => Promise<T>): Promise<T> {
  return runWithScope({ kind: 'platform' }, fn);
}

describe('tenant isolation', () => {
  it('only returns rows of the current tenant', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });

    await createCustomer(alpha.restaurantId, 'alpha-customer');
    await createCustomer(beta.restaurantId, 'beta-customer');

    const customers = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () => prisma.customer.findMany(),
    );

    expect(customers).toHaveLength(1);
    expect(customers[0].restaurantId).toBe(alpha.restaurantId);
  });

  it('does not leak a row of another tenant through findFirst', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });
    const betaCustomer = await createCustomer(beta.restaurantId, 'beta-customer');

    const found = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () => prisma.customer.findFirst({ where: { id: betaCustomer.id } }),
    );

    expect(found).toBeNull();
  });

  it('refuses to update a row of another tenant', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });
    const betaCustomer = await createCustomer(beta.restaurantId, 'beta-customer');

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        prisma.customer.update({
          where: { id: betaCustomer.id },
          data: { name: 'hijacked' },
        }),
      ),
    ).rejects.toThrow();

    const unchanged = await asPlatform(() =>
      prisma.customer.findUnique({
        where: { id: betaCustomer.id },
        select: { name: true },
      }),
    );
    expect(unchanged?.name).toBe('beta-customer');
  });

  it('refuses to delete a row of another tenant', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });
    const betaCustomer = await createCustomer(beta.restaurantId, 'beta-customer');

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        prisma.customer.delete({ where: { id: betaCustomer.id } }),
      ),
    ).rejects.toThrow();

    const stillThere = await asPlatform(() =>
      prisma.customer.findUnique({
        where: { id: betaCustomer.id },
        select: { id: true },
      }),
    );
    expect(stillThere).not.toBeNull();
  });

  it('rejects an explicit filter for a foreign tenant', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        prisma.customer.findMany({ where: { restaurantId: beta.restaurantId } }),
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects a write that targets a foreign tenant', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        prisma.customer.create({
          data: { restaurantId: beta.restaurantId, name: 'injected' },
        }),
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('scopes the restaurant row to the tenant itself', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    await createTenant({ name: 'Beta' });

    const restaurants = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () => prisma.restaurant.findMany(),
    );

    expect(restaurants).toHaveLength(1);
    expect(restaurants[0].id).toBe(alpha.restaurantId);
  });

  it('refuses to read the restaurant row of another tenant', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        prisma.restaurant.findFirst({ where: { id: beta.restaurantId } }),
      ),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('scopes tenant-optional models such as users to the tenant', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });
    await createEmployee(alpha.restaurantId, { email: 'alpha-staff@test.local' });
    await createEmployee(beta.restaurantId, { email: 'beta-staff@test.local' });

    const users = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () => prisma.user.findMany(),
    );

    expect(users.every((user) => user.restaurantId === alpha.restaurantId)).toBe(true);
    expect(users.map((user) => user.email)).toContain('alpha-staff@test.local');
    expect(users.map((user) => user.email)).not.toContain('beta-staff@test.local');
  });

  it('does not allow touching tenant-owned models without a tenant scope', async () => {
    await expect(prisma.customer.findMany()).rejects.toBeInstanceOf(ApiError);
  });

  it('lets the platform scope read across tenants', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });
    await createCustomer(alpha.restaurantId, 'alpha-customer');
    await createCustomer(beta.restaurantId, 'beta-customer');

    const customers = await runWithScope({ kind: 'platform' }, () => prisma.customer.findMany());

    expect(customers).toHaveLength(2);
  });

  it('keeps the tenant filter when the promise is awaited outside the scope', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });
    await createCustomer(alpha.restaurantId, 'alpha-customer');
    await createCustomer(beta.restaurantId, 'beta-customer');

    const promise = runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () => prisma.customer.findMany(),
    );

    expect(await promise).toHaveLength(1);
  });
});
