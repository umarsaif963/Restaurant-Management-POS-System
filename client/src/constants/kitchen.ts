import { KITCHEN_ORDER_STATUSES, type KitchenOrderStatus } from '@restaurant/shared';

export const KITCHEN_STATUS_LABELS: Record<(typeof KITCHEN_ORDER_STATUSES)[number], string> = {
  PENDING: 'Pending',
  ACCEPTED: 'Accepted',
  PREPARING: 'Preparing',
  READY: 'Ready',
  SERVED: 'Served',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const KITCHEN_STATUS_BADGE: Record<
  (typeof KITCHEN_ORDER_STATUSES)[number],
  'slate' | 'green' | 'red' | 'amber' | 'blue'
> = {
  PENDING: 'slate',
  ACCEPTED: 'blue',
  PREPARING: 'amber',
  READY: 'green',
  SERVED: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

/** Same transition map as the server — drives the "advance ticket" buttons. */
export const KITCHEN_NEXT: Record<KitchenOrderStatus, KitchenOrderStatus[]> = {
  PENDING: ['ACCEPTED', 'CANCELLED'],
  ACCEPTED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['SERVED'],
  SERVED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

/** Roles allowed to drive a kitchen ticket forward. */
export const KITCHEN_OPERATOR_ROLES = ['KITCHEN_STAFF', 'MANAGER', 'ADMIN'] as const;