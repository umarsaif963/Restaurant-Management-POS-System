import { RESERVATION_STATUSES } from '@restaurant/shared';

export const RESERVATION_STATUS_LABELS: Record<(typeof RESERVATION_STATUSES)[number], string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SEATED: 'Seated',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const RESERVATION_STATUS_BADGE: Record<
  (typeof RESERVATION_STATUSES)[number],
  'amber' | 'blue' | 'green' | 'slate' | 'red'
> = {
  PENDING: 'amber',
  CONFIRMED: 'blue',
  SEATED: 'green',
  COMPLETED: 'slate',
  CANCELLED: 'red',
};