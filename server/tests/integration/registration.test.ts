import { describe, expect, it, vi } from 'vitest';
import { prisma } from '../../src/config/prisma.js';
import { runWithScope } from '../../src/config/tenant-context.js';
import { registerRestaurant } from '../../src/services/registration.service.js';

describe('restaurant registration', () => {
  it('creates the venue, its settings and the owner account', async () => {
    const result = await registerRestaurant({
      restaurantName: 'Trattoria Nova',
      ownerName: 'Nadia Owner',
      email: 'nadia@trattoria.test',
      password: 'Owner@12345',
      confirmPassword: 'Owner@12345',
      address: '1 Test Street',
      phone: '+1 555 0100',
    });

    expect(result.restaurant.name).toBe('Trattoria Nova');
    expect(result.restaurant.slug).toBe('trattoria-nova');
    expect(result.restaurant.status).toBe('ACTIVE');
    expect(result.user.role).toBe('ADMIN');
    expect(result.user.restaurantId).toBe(result.restaurant.id);

    const settings = await runWithScope(
      { kind: 'tenant', restaurantId: result.restaurant.id },
      () =>
        prisma.restaurantSettings.findUnique({
          where: { restaurantId: result.restaurant.id },
          select: { currency: true },
        }),
    );
    expect(settings?.currency).toBe('USD');

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: result.restaurant.id },
      select: { ownerId: true },
    });
    expect(restaurant?.ownerId).toBe(result.user.id);
  });

  it('gives the owner the full restaurant permission set', async () => {
    const result = await registerRestaurant({
      restaurantName: 'Perm Kitchen',
      ownerName: 'Perm Owner',
      email: 'owner@perm.test',
      password: 'Owner@12345',
      confirmPassword: 'Owner@12345',
    });

    expect(result.user.permissions).toContain('EMPLOYEES_WRITE');
    expect(result.user.permissions).toContain('ROLES_WRITE');
    expect(result.user.permissions).not.toContain('PLATFORM_MANAGE_RESTAURANTS');
  });

  it('rejects a duplicate email', async () => {
    await registerRestaurant({
      restaurantName: 'First Venue',
      ownerName: 'First Owner',
      email: 'duplicate@venue.test',
      password: 'Owner@12345',
      confirmPassword: 'Owner@12345',
    });

    await expect(
      registerRestaurant({
        restaurantName: 'Second Venue',
        ownerName: 'Second Owner',
        email: 'duplicate@venue.test',
        password: 'Owner@12345',
        confirmPassword: 'Owner@12345',
      }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('keeps the slug unique across venues', async () => {
    const first = await registerRestaurant({
      restaurantName: 'Same Name',
      ownerName: 'Owner One',
      email: 'one@same.test',
      password: 'Owner@12345',
      confirmPassword: 'Owner@12345',
    });
    const second = await registerRestaurant({
      restaurantName: 'Same Name',
      ownerName: 'Owner Two',
      email: 'two@same.test',
      password: 'Owner@12345',
      confirmPassword: 'Owner@12345',
    });

    expect(first.restaurant.slug).toBe('same-name');
    expect(second.restaurant.slug).toBe('same-name-2');
  });

  it('does not leave a half-created venue behind when the owner cannot be created', async () => {
    const before = await prisma.restaurant.count();

    const spy = vi
      .spyOn(prisma as unknown as { $transaction: (...args: unknown[]) => unknown }, '$transaction')
      .mockRejectedValueOnce(new Error('transaction failed'));

    await expect(
      registerRestaurant({
        restaurantName: 'Broken Venue',
        ownerName: 'Broken Owner',
        email: 'broken@venue.test',
        password: 'Owner@12345',
      confirmPassword: 'Owner@12345',
      }),
    ).rejects.toThrow('transaction failed');

    spy.mockRestore();

    const after = await prisma.restaurant.count();
    expect(after).toBe(before);
  });
});
