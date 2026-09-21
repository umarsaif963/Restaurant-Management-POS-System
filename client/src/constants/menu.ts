import { MENU_ITEM_STATUSES } from '@restaurant/shared';

export const MENU_ITEM_STATUS_LABELS: Record<(typeof MENU_ITEM_STATUSES)[number], string> = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
};

export const MENU_ITEM_STATUS_BADGE: Record<
  (typeof MENU_ITEM_STATUSES)[number],
  'green' | 'red' | 'amber' | 'blue'
> = {
  ACTIVE: 'green',
  INACTIVE: 'red',
};