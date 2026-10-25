import { describe, expect, it } from 'vitest';
import {
  ALL_RESTAURANT_PERMISSIONS,
  PERMISSIONS,
  PLATFORM_PERMISSIONS,
  resolvePermissions,
  withoutPlatformPermissions,
} from '@restaurant/shared';

describe('resolvePermissions', () => {
  it('gives the owner every restaurant permission', () => {
    const resolved = resolvePermissions({ role: 'ADMIN' });
    expect(resolved).toEqual(expect.arrayContaining([...ALL_RESTAURANT_PERMISSIONS]));
    expect(resolved).not.toContain('PLATFORM_VIEW_RESTAURANTS');
  });

  it('gives the platform operator every permission, including platform ones', () => {
    const resolved = resolvePermissions({ role: 'SUPER_ADMIN' });
    for (const permission of PLATFORM_PERMISSIONS) {
      expect(resolved).toContain(permission);
    }
  });

  it('never hands platform permissions to a restaurant role', () => {
    for (const role of ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'KITCHEN_STAFF'] as const) {
      const resolved = resolvePermissions({ role });
      for (const permission of PLATFORM_PERMISSIONS) {
        expect(resolved).not.toContain(permission);
      }
    }
  });

  it('restricts a built-in role to its documented capability set', () => {
    const cashier = resolvePermissions({ role: 'CASHIER' });
    expect(cashier).toContain('ORDERS_CREATE');
    expect(cashier).not.toContain('ORDERS_REFUND');
    expect(cashier).not.toContain('INVENTORY_WRITE');
    expect(cashier).not.toContain('ROLES_WRITE');
  });

  it('replaces the role defaults when a custom role is attached', () => {
    const resolved = resolvePermissions({
      role: 'ADMIN',
      customRolePermissions: ['POS_USE', 'ORDERS_READ'],
    });
    expect(resolved).toEqual(['POS_USE', 'ORDERS_READ']);
  });

  it('falls back to the role defaults when the custom role is empty', () => {
    const resolved = resolvePermissions({ role: 'CASHIER', customRolePermissions: [] });
    expect(resolved).toContain('PAYMENTS_CREATE');
  });

  it('adds individual grants on top of the role', () => {
    const resolved = resolvePermissions({
      role: 'CASHIER',
      extraPermissions: ['INVENTORY_WRITE'],
    });
    expect(resolved).toContain('INVENTORY_WRITE');
  });

  it('removes individually restricted permissions', () => {
    const resolved = resolvePermissions({
      role: 'ADMIN',
      restrictedPermissions: ['SETTINGS_WRITE'],
    });
    expect(resolved).not.toContain('SETTINGS_WRITE');
    expect(resolved).toContain('SETTINGS_READ');
  });

  it('applies revocations after grants', () => {
    const resolved = resolvePermissions({
      role: 'CASHIER',
      extraPermissions: ['INVENTORY_WRITE'],
      restrictedPermissions: ['INVENTORY_WRITE'],
    });
    expect(resolved).not.toContain('INVENTORY_WRITE');
  });

  it('returns the permissions in catalogue order and without duplicates', () => {
    const resolved = resolvePermissions({
      role: 'ADMIN',
      extraPermissions: ['POS_USE', 'POS_USE'],
    });
    expect(new Set(resolved).size).toBe(resolved.length);
    expect(resolved).toEqual(
      [...resolved].sort((a, b) => PERMISSIONS.indexOf(a) - PERMISSIONS.indexOf(b)),
    );
  });
});

describe('withoutPlatformPermissions', () => {
  it('strips every platform capability', () => {
    const stripped = withoutPlatformPermissions([...PLATFORM_PERMISSIONS, 'POS_USE']);
    expect(stripped).toEqual(['POS_USE']);
  });
});
