import { describe, expect, it } from 'vitest';
import { prisma } from '../../src/config/prisma.js';
import { runWithScope } from '../../src/config/tenant-context.js';
import {
  createEmployee,
  createRole,
  createTenant,
} from '../helpers/factories.js';
import {
  createEmployee as createEmployeeService,
  deactivateEmployee,
  getEmployee,
  listEmployees,
  resetEmployeePassword,
  updateEmployee,
} from '../../src/services/user.service.js';
import type { EmployeeActor } from '../../src/services/user.service.js';

function ownerActor(restaurantId: string, userId: string): EmployeeActor {
  return {
    userId,
    role: 'ADMIN',
    restaurantId,
    permissions: ['EMPLOYEES_READ', 'EMPLOYEES_WRITE'],
  };
}

describe('employee management', () => {
  it('lists only the employees of the current restaurant', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });
    await createEmployee(alpha.restaurantId, { email: 'alpha-waiter@test.local' });
    await createEmployee(beta.restaurantId, { email: 'beta-waiter@test.local' });

    const result = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () => listEmployees({}, ownerActor(alpha.restaurantId, alpha.ownerId)),
    );

    expect(result.items.every((item) => item.restaurantId === alpha.restaurantId)).toBe(true);
    expect(result.items.map((item) => item.email)).toContain('alpha-waiter@test.local');
    expect(result.items.map((item) => item.email)).not.toContain('beta-waiter@test.local');
  });

  it('reports an employee of another restaurant as not found', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });
    const betaEmployee = await createEmployee(beta.restaurantId, {
      email: 'beta-waiter@test.local',
    });

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        getEmployee(betaEmployee.id, ownerActor(alpha.restaurantId, alpha.ownerId)),
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('creates an employee inside the tenant and returns a temporary password', async () => {
    const alpha = await createTenant({ name: 'Alpha' });

    const result = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () =>
        createEmployeeService(
          { name: 'New Waiter', email: 'new-waiter@test.local', role: 'WAITER' },
          ownerActor(alpha.restaurantId, alpha.ownerId),
        ),
    );

    expect(result.temporaryPassword).toBeTruthy();
    expect(result.employee.email).toBe('new-waiter@test.local');
    expect(result.employee.restaurantId).toBe(alpha.restaurantId);

    const stored = await prisma.user.findUnique({
      where: { email: 'new-waiter@test.local' },
      select: { restaurantId: true, mustChangePassword: true },
    });
    expect(stored?.restaurantId).toBe(alpha.restaurantId);
    expect(stored?.mustChangePassword).toBe(true);
  });

  it('never grants platform permissions to an employee', async () => {
    const alpha = await createTenant({ name: 'Alpha' });

    const result = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () =>
        createEmployeeService(
          {
            name: 'Sneaky',
            email: 'sneaky@test.local',
            role: 'WAITER',
            extraPermissions: ['PLATFORM_MANAGE_RESTAURANTS', 'ORDERS_REFUND'],
          },
          ownerActor(alpha.restaurantId, alpha.ownerId),
        ),
    );

    expect(result.employee.extraPermissions).toEqual(['ORDERS_REFUND']);

    const stored = await prisma.user.findUnique({
      where: { email: 'sneaky@test.local' },
      select: { extraPermissions: true },
    });
    expect(stored?.extraPermissions).toEqual(['ORDERS_REFUND']);
  });

  it('refuses to assign the platform role', async () => {
    const alpha = await createTenant({ name: 'Alpha' });

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        createEmployeeService(
          { name: 'Sneaky', email: 'sneaky2@test.local', role: 'SUPER_ADMIN' },
          ownerActor(alpha.restaurantId, alpha.ownerId),
        ),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('keeps the individual grants when the update does not mention them', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const employee = await createEmployee(alpha.restaurantId, {
      email: 'granted@test.local',
      extraPermissions: ['INVENTORY_WRITE'],
      restrictedPermissions: ['PAYMENTS_REFUND'],
    });

    const updated = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () =>
        updateEmployee(
          employee.id,
          { name: 'Renamed' },
          ownerActor(alpha.restaurantId, alpha.ownerId),
        ),
    );

    expect(updated.name).toBe('Renamed');
    expect(updated.extraPermissions).toEqual(['INVENTORY_WRITE']);
    expect(updated.restrictedPermissions).toEqual(['PAYMENTS_REFUND']);
  });

  it('does not let an employee change their own role', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const owner = await prisma.user.findUnique({
      where: { id: alpha.ownerId },
      select: { id: true },
    });

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        updateEmployee(
          owner!.id,
          { role: 'WAITER' },
          ownerActor(alpha.restaurantId, alpha.ownerId),
        ),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('revokes the sessions of a deactivated employee', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const employee = await createEmployee(alpha.restaurantId, { email: 'gone@test.local' });

    const session = await prisma.session.create({
      data: {
        userId: employee.id,
        tokenHash: 'test-token-hash',
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    await runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
      deactivateEmployee(employee.id, ownerActor(alpha.restaurantId, alpha.ownerId)),
    );

    const reloaded = await prisma.session.findUnique({
      where: { id: session.id },
      select: { revokedAt: true },
    });
    expect(reloaded?.revokedAt).not.toBeNull();

    const user = await prisma.user.findUnique({
      where: { id: employee.id },
      select: { status: true },
    });
    expect(user?.status).toBe('INACTIVE');
  });

  it('issues a new temporary password and revokes the sessions', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const employee = await createEmployee(alpha.restaurantId, { email: 'reset@test.local' });

    const session = await prisma.session.create({
      data: {
        userId: employee.id,
        tokenHash: 'test-token-hash-2',
        expiresAt: new Date(Date.now() + 60_000),
      },
    });

    const result = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () => resetEmployeePassword(employee.id, ownerActor(alpha.restaurantId, alpha.ownerId)),
    );

    expect(result.temporaryPassword).toBeTruthy();

    const reloaded = await prisma.session.findUnique({
      where: { id: session.id },
      select: { revokedAt: true },
    });
    expect(reloaded?.revokedAt).not.toBeNull();
  });

  it('refuses to attach a custom role of another restaurant', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });
    const betaRole = await createRole(beta.restaurantId, { name: 'Beta Role' });

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        createEmployeeService(
          {
            name: 'Borrower',
            email: 'borrower@test.local',
            role: 'WAITER',
            customRoleId: betaRole.id,
          },
          ownerActor(alpha.restaurantId, alpha.ownerId),
        ),
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
