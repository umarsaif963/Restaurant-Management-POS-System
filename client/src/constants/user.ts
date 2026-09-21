import { USER_ROLES, USER_STATUSES } from '@restaurant/shared';

export const ROLE_OPTIONS = USER_ROLES;

export const ROLE_LABELS: Record<(typeof USER_ROLES)[number], string> = {
  ADMIN: 'Administrator',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  WAITER: 'Waiter',
  KITCHEN_STAFF: 'Kitchen staff',
};

export const ROLE_BADGE: Record<(typeof USER_ROLES)[number], 'red' | 'blue' | 'green' | 'amber' | 'slate'> = {
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