import type { PaymentStatus } from '@prisma/client';
import { toCents } from './money.js';

/**
 * Billing derivation shared by the payment service and order recalculation
 * (module 9): a payment status depends only on net paid vs grand total, plus
 * whether any refunds exist (so a paid-then-fully-refunded order reads as
 * REFUNDED rather than UNPAID).
 */
export function derivePaymentStatus(params: {
  netPaidCents: number;
  grandTotalCents: number;
  hasRefunds: boolean;
}): PaymentStatus {
  if (params.netPaidCents <= 0) {
    return params.hasRefunds ? 'REFUNDED' : 'UNPAID';
  }
  if (params.netPaidCents >= Math.max(0, params.grandTotalCents)) {
    return 'PAID';
  }
  return 'PARTIAL';
}

export function netPaidCents(totalPaid: string | number): number {
  return toCents(totalPaid);
}