import { TABLE_STATUSES } from '@restaurant/shared';

export const TABLE_STATUS_LABELS: Record<(typeof TABLE_STATUSES)[number], string> = {
  AVAILABLE: 'Available',
  OCCUPIED: 'Occupied',
  RESERVED: 'Reserved',
  CLEANING: 'Cleaning',
};

export const TABLE_STATUS_BADGE: Record<
  (typeof TABLE_STATUSES)[number],
  'green' | 'red' | 'amber' | 'blue'
> = {
  AVAILABLE: 'green',
  OCCUPIED: 'red',
  RESERVED: 'amber',
  CLEANING: 'blue',
};