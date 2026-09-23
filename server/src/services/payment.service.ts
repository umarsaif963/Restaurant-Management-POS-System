import type {
  PaymentProfile,
  PaymentRecordResult,
  PaymentRefundResult,
  RecordPaymentInput,
  RefundPaymentInput,
} from '@restaurant/shared';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';
import { fromCents, toCents } from '../utils/money.js';
import { derivePaymentStatus } from '../utils/billing.js';
import { getOrder } from './order.service.js';
import { realtime } from '../sockets/realtime.js';

function toPayment(payment: {
  id: string;
  orderId: string;
  amount: { toString(): string };
  method: PaymentProfile['method'];
  transactionRef: string | null;
  changeDue: { toString(): string } | null;
  notes: string | null;
  isRefund: boolean;
  refundOfId: string | null;
  paidAt: Date;
  receivedBy?: { name: string } | null;
}): PaymentProfile {
  return {
    id: payment.id,
    orderId: payment.orderId,
    amount: payment.amount.toString(),
    method: payment.method,
    transactionRef: payment.transactionRef,
    receivedByName: payment.receivedBy?.name ?? null,
    changeDue: payment.changeDue?.toString() ?? null,
    notes: payment.notes,
    isRefund: payment.isRefund,
    refundOfId: payment.refundOfId,
    paidAt: payment.paidAt.toISOString(),
  };
}

export async function listOrderPayments(orderId: string): Promise<PaymentProfile[]> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { id: true } });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  const rows = await prisma.payment.findMany({
    where: { orderId },
    include: { receivedBy: { select: { name: true } } },
    orderBy: { paidAt: 'asc' },
  });
  return rows.map(toPayment);
}

async function requirePayableOrder(orderId: string): Promise<{
  grandTotalCents: number;
  balanceDueCents: number;
  cancelled: boolean;
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { grandTotal: true, balanceDue: true, status: true },
  });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  if (order.status === 'CANCELLED') {
    throw ApiError.conflict('Cancelled orders cannot accept payments.');
  }
  return {
    grandTotalCents: toCents(order.grandTotal.toString()),
    balanceDueCents: toCents(order.balanceDue.toString()),
    cancelled: false,
  };
}

export async function recordPayment(
  orderId: string,
  input: RecordPaymentInput,
  userId: string,
): Promise<PaymentRecordResult> {
  const { balanceDueCents, grandTotalCents } = await requirePayableOrder(orderId);
  if (balanceDueCents <= 0) {
    throw ApiError.conflict('This order is already paid in full.');
  }

  const receivedCents = toCents(input.amount);
  if (receivedCents <= 0) {
    throw ApiError.badRequest('Payment amount must be greater than zero.');
  }

  // Cash tendered can exceed the balance — the excess is returned as change
  // and never over-applied to the order.
  const appliedCents = Math.min(receivedCents, balanceDueCents);
  const changeCents = Math.max(0, receivedCents - balanceDueCents);

  const payment = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        orderId,
        amount: fromCents(appliedCents),
        method: input.method,
        transactionRef: input.transactionRef ?? null,
        receivedById: userId,
        changeDue: changeCents > 0 ? fromCents(changeCents) : null,
        notes: input.notes ?? null,
      },
      include: { receivedBy: { select: { name: true } } },
    });
    await tx.order.update({
      where: { id: orderId },
      data: {
        totalPaid: { increment: fromCents(appliedCents) },
        balanceDue: { decrement: fromCents(appliedCents) },
      },
    });
    return created;
  });

  const order = await refreshPaymentStatus(orderId, grandTotalCents);
  realtime.orderUpdated({ orderId });

  return {
    payment: toPayment(payment),
    order,
  };
}

async function refreshPaymentStatus(orderId: string, grandTotalCents: number) {
  const [collected, refunded] = await prisma.$transaction([
    prisma.payment.aggregate({
      where: { orderId, isRefund: false },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { orderId, isRefund: true },
      _sum: { amount: true },
    }),
  ]);
  const collectedCents = toCents((collected._sum.amount ?? 0).toString());
  const refundedCents = toCents((refunded._sum.amount ?? 0).toString());
  const status = derivePaymentStatus({
    netPaidCents: collectedCents - refundedCents,
    grandTotalCents,
    hasRefunds: refundedCents > 0,
  });
  await prisma.order.update({ where: { id: orderId }, data: { paymentStatus: status } });
  return getOrder(orderId);
}

export async function refundPayment(
  orderId: string,
  paymentId: string,
  input: RefundPaymentInput,
  userId: string,
): Promise<PaymentRefundResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { grandTotal: true, totalPaid: true, status: true },
  });
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, orderId, isRefund: false },
    select: { id: true, amount: true, method: true },
  });
  if (!payment) {
    throw ApiError.notFound('Collectable payment not found');
  }

  const refundedSoFar = await prisma.payment.aggregate({
    where: { refundOfId: paymentId },
    _sum: { amount: true },
  });
  const refundableCents = toCents(payment.amount.toString()) - toCents((refundedSoFar._sum.amount ?? 0).toString());

  const amountCents = toCents(input.amount);
  if (amountCents <= 0) {
    throw ApiError.badRequest('Refund amount must be greater than zero.');
  }
  if (amountCents > refundableCents) {
    throw ApiError.badRequest('Refund cannot exceed the amount collectable from this payment.');
  }
  if (amountCents > toCents(order.totalPaid.toString())) {
    throw ApiError.conflict('Refund exceeds the total amount collected for this order.');
  }

  const refund = await prisma.$transaction(async (tx) => {
    const created = await tx.payment.create({
      data: {
        orderId,
        amount: fromCents(amountCents),
        method: input.method ?? payment.method,
        transactionRef: input.transactionRef ?? null,
        receivedById: userId,
        notes: input.notes ?? null,
        isRefund: true,
        refundOfId: paymentId,
      },
      include: { receivedBy: { select: { name: true } } },
    });
    await tx.order.update({
      where: { id: orderId },
      data: {
        totalPaid: { decrement: fromCents(amountCents) },
        balanceDue: { increment: fromCents(amountCents) },
      },
    });
    return created;
  });

  const refreshed = await refreshPaymentStatus(orderId, toCents(order.grandTotal.toString()));
  realtime.orderUpdated({ orderId });

  return {
    refund: toPayment(refund),
    order: refreshed,
  };
}