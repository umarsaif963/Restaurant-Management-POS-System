import { INVENTORY_TRANSACTION_TYPES, STOCK_UNITS } from '@restaurant/shared';

export const STOCK_UNIT_LABELS: Record<(typeof STOCK_UNITS)[number], string> = {
  KG: 'kg',
  GRAM: 'g',
  LITER: 'L',
  ML: 'mL',
  PIECE: 'pc',
  PACK: 'pack',
};

export const INVENTORY_TRANSACTION_TYPE_LABELS: Record<
  (typeof INVENTORY_TRANSACTION_TYPES)[number],
  string
> = {
  PURCHASE: 'Purchase',
  SALE: 'Sale',
  ADJUSTMENT: 'Adjustment',
  WASTAGE: 'Wastage',
  DAMAGE: 'Damage',
  RETURN: 'Return',
  ORDER_CANCEL: 'Order reversal',
};

export const INVENTORY_TRANSACTION_TYPE_BADGE: Record<
  (typeof INVENTORY_TRANSACTION_TYPES)[number],
  'green' | 'blue' | 'amber' | 'red' | 'slate'
> = {
  PURCHASE: 'green',
  SALE: 'blue',
  ADJUSTMENT: 'amber',
  WASTAGE: 'red',
  DAMAGE: 'red',
  RETURN: 'slate',
  ORDER_CANCEL: 'slate',
};

export const STOCK_HEALTH_LABELS: Record<'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK', string> = {
  IN_STOCK: 'In stock',
  LOW_STOCK: 'Low stock',
  OUT_OF_STOCK: 'Out of stock',
};

export const STOCK_HEALTH_BADGE: Record<'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK', 'green' | 'amber' | 'red'> = {
  IN_STOCK: 'green',
  LOW_STOCK: 'amber',
  OUT_OF_STOCK: 'red',
};

export const CATEGORIES = [
  'Bakery',
  'Dairy',
  'Meat',
  'Produce',
  'Pantry',
  'Beverages',
  'Frozen',
] as const;