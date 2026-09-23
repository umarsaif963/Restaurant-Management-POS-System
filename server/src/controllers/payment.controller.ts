import type { Request, Response } from 'express';
import type { RecordPaymentInput, RefundPaymentInput } from '@restaurant/shared';
import * as paymentService from '../services/payment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function currentUserId(req: Request): string {
  return req.authenticated!.userId;
}

export const listOrderPayments = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const payments = await paymentService.listOrderPayments(id);
  res.status(200).json({ success: true, data: { payments } });
});

export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as RecordPaymentInput;
  const result = await paymentService.recordPayment(id, body, currentUserId(req));
  res.status(201).json({ success: true, data: result });
});

export const refundPayment = asyncHandler(async (req: Request, res: Response) => {
  const { id, paymentId } = req.validatedParams as { id: string; paymentId: string };
  const body = req.validatedBody as RefundPaymentInput;
  const result = await paymentService.refundPayment(id, paymentId, body, currentUserId(req));
  res.status(201).json({ success: true, data: result });
});