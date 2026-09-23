import { PURCHASE_STATUSES } from '@restaurant/shared';

export const PURCHASE_STATUS_LABELS: Record<(typeof PURCHASE_STATUSES)[number], string> = {
  PENDING: 'Pending',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

export const PURCHASE_STATUS_BADGE: Record<
  (typeof PURCHASE_STATUSES)[number],
  'amber' | 'green' | 'red'
> = {
  PENDING: 'amber',
  RECEIVED: 'green',
  CANCELLED: 'red',
};