import { ORDER_STATUSES, ORDER_TYPES, PAYMENT_STATUSES } from '@restaurant/shared';

export const ORDER_TYPE_LABELS: Record<(typeof ORDER_TYPES)[number], string> = {
  DINE_IN: 'Dine-in',
  TAKEAWAY: 'Takeaway',
  DELIVERY: 'Delivery',
};

export const ORDER_TYPE_BADGE: Record<
  (typeof ORDER_TYPES)[number],
  'green' | 'red' | 'amber' | 'blue'
> = {
  DINE_IN: 'blue',
  TAKEAWAY: 'amber',
  DELIVERY: 'green',
};

export const ORDER_STATUS_LABELS: Record<(typeof ORDER_STATUSES)[number], string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PREPARING: 'Preparing',
  READY: 'Ready',
  SERVED: 'Served',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const ORDER_STATUS_BADGE: Record<
  (typeof ORDER_STATUSES)[number],
  'slate' | 'green' | 'red' | 'amber' | 'blue'
> = {
  PENDING: 'slate',
  CONFIRMED: 'blue',
  PREPARING: 'amber',
  READY: 'green',
  SERVED: 'blue',
  COMPLETED: 'green',
  CANCELLED: 'red',
};

export const PAYMENT_STATUS_LABELS: Record<(typeof PAYMENT_STATUSES)[number], string> = {
  UNPAID: 'Unpaid',
  PARTIAL: 'Partially paid',
  PAID: 'Paid',
  REFUNDED: 'Refunded',
};

export const PAYMENT_STATUS_BADGE: Record<
  (typeof PAYMENT_STATUSES)[number],
  'slate' | 'green' | 'red' | 'amber' | 'blue'
> = {
  UNPAID: 'red',
  PARTIAL: 'amber',
  PAID: 'green',
  REFUNDED: 'slate',
};

/** Order statuses that still allow adding/removing items. */
export const ORDER_STATUSES_ALLOW_ITEM_EDITS = ['PENDING', 'CONFIRMED'] as const;