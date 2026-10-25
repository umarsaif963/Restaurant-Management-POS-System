import { describe, expect, it } from 'vitest';
import { runWithScope } from '../../src/config/tenant-context.js';
import { createEmployee, createRole, createTenant } from '../helpers/factories.js';
import {
  createRole as createRoleService,
  deleteRole,
  getRole,
  listRoles,
  updateRole,
} from '../../src/services/role.service.js';
import type { RoleActor } from '../../src/services/role.service.js';

function ownerActor(restaurantId: string, userId: string): RoleActor {
  return { userId, restaurantId };
}

describe('role management', () => {
  it('lists only the roles of the current restaurant', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });
    await createRole(alpha.restaurantId, { name: 'Alpha Role' });
    await createRole(beta.restaurantId, { name: 'Beta Role' });

    const roles = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () => listRoles(ownerActor(alpha.restaurantId, alpha.ownerId)),
    );

    expect(roles).toHaveLength(1);
    expect(roles[0].name).toBe('Alpha Role');
  });

  it('reports a role of another restaurant as not found', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });
    const betaRole = await createRole(beta.restaurantId, { name: 'Beta Role' });

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        getRole(betaRole.id, ownerActor(alpha.restaurantId, alpha.ownerId)),
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  it('strips platform permissions from a custom role', async () => {
    const alpha = await createTenant({ name: 'Alpha' });

    const role = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () =>
        createRoleService(
          {
            name: 'Shift Lead',
            permissions: ['PLATFORM_MANAGE_RESTAURANTS', 'POS_USE', 'ORDERS_READ'],
          },
          ownerActor(alpha.restaurantId, alpha.ownerId),
        ),
    );

    expect(role.permissions).toEqual(['POS_USE', 'ORDERS_READ']);
    expect(role.isSystem).toBe(false);
    expect(role.restaurantId).toBe(alpha.restaurantId);
  });

  it('gives every role of a restaurant a unique slug', async () => {
    const alpha = await createTenant({ name: 'Alpha' });

    const first = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () =>
        createRoleService({ name: 'Shift Lead', permissions: ['POS_USE'] }, ownerActor(alpha.restaurantId, alpha.ownerId)),
    );
    const second = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () =>
        createRoleService({ name: 'Shift Lead', permissions: ['POS_USE'] }, ownerActor(alpha.restaurantId, alpha.ownerId)),
    );

    expect(first.slug).not.toBe(second.slug);
  });

  it('refuses to modify a built-in role', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const systemRole = await createRole(alpha.restaurantId, {
      name: 'Admin',
      isSystem: true,
    });

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        updateRole(
          systemRole.id,
          { permissions: ['POS_USE'] },
          ownerActor(alpha.restaurantId, alpha.ownerId),
        ),
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it('refuses to delete a role that is still assigned', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const role = await createRole(alpha.restaurantId, { name: 'Shift Lead' });
    await createEmployee(alpha.restaurantId, { roleId: role.id });

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        deleteRole(role.id, ownerActor(alpha.restaurantId, alpha.ownerId)),
      ),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('deletes an unused custom role', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const role = await createRole(alpha.restaurantId, { name: 'Shift Lead' });

    await runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
      deleteRole(role.id, ownerActor(alpha.restaurantId, alpha.ownerId)),
    );

    const roles = await runWithScope(
      { kind: 'tenant', restaurantId: alpha.restaurantId },
      () => listRoles(ownerActor(alpha.restaurantId, alpha.ownerId)),
    );
    expect(roles).toHaveLength(0);
  });

  it('refuses to delete a role of another restaurant', async () => {
    const alpha = await createTenant({ name: 'Alpha' });
    const beta = await createTenant({ name: 'Beta' });
    const betaRole = await createRole(beta.restaurantId, { name: 'Beta Role' });

    await expect(
      runWithScope({ kind: 'tenant', restaurantId: alpha.restaurantId }, () =>
        deleteRole(betaRole.id, ownerActor(alpha.restaurantId, alpha.ownerId)),
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
