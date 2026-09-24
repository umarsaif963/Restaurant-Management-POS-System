import { PaymentMethod } from '@restaurant/shared';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Cash',
  CARD: 'Card',
  BANK_TRANSFER: 'Bank transfer',
  OTHER: 'Other',
};

export const PAYMENT_METHOD_BADGE: Record<PaymentMethod, 'green' | 'blue' | 'amber' | 'slate'> = {
  CASH: 'green',
  CARD: 'blue',
  BANK_TRANSFER: 'amber',
  OTHER: 'slate',
};

export const PAYMENT_METHOD_ORDER: PaymentMethod[] = ['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER'];
