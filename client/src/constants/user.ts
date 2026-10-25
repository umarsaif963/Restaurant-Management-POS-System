import { RESTAURANT_USER_ROLES, USER_ROLES, USER_STATUSES } from '@restaurant/shared';

export const ROLE_OPTIONS = USER_ROLES;

/** Roles a restaurant owner may hand out. */
export const ASSIGNABLE_ROLE_OPTIONS = RESTAURANT_USER_ROLES;

export const ROLE_LABELS: Record<(typeof USER_ROLES)[number], string> = {
  SUPER_ADMIN: 'Platform administrator',
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  WAITER: 'Waiter',
  KITCHEN_STAFF: 'Kitchen staff',
};

export const ROLE_BADGE: Record<
  (typeof USER_ROLES)[number],
  'red' | 'blue' | 'green' | 'amber' | 'slate'
> = {
  SUPER_ADMIN: 'red',
  ADMIN: 'red',
  MANAGER: 'blue',
  CASHIER: 'green',
  WAITER: 'amber',
  KITCHEN_STAFF: 'slate',
};

export const STATUS_LABELS: Record<(typeof USER_STATUSES)[number], string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  SUSPENDED: 'Suspended',
};

export const STATUS_BADGE: Record<(typeof USER_STATUSES)[number], 'green' | 'slate' | 'red'> = {
  ACTIVE: 'green',
  INACTIVE: 'slate',
  SUSPENDED: 'red',
};
