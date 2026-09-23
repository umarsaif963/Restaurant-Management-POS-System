import type { Request, Response } from 'express';
import type {
  ChangeReservationStatusInput,
  CreateReservationInput,
  ListReservationsQuery,
  UpdateReservationInput,
} from '@restaurant/shared';
import * as reservationService from '../services/reservation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

function currentUserId(req: Request): string {
  return req.authenticated!.userId;
}

export const listReservations = asyncHandler(async (req: Request, res: Response) => {
  const query = req.validatedQuery as unknown as ListReservationsQuery;
  const data = await reservationService.listReservations(query);
  res.status(200).json({ success: true, data });
});

export const getReservation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const reservation = await reservationService.getReservation(id);
  res.status(200).json({ success: true, data: { reservation } });
});

export const createReservation = asyncHandler(async (req: Request, res: Response) => {
  const body = req.validatedBody as CreateReservationInput;
  const reservation = await reservationService.createReservation(body, currentUserId(req));
  res.status(201).json({ success: true, data: { reservation } });
});

export const updateReservation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as UpdateReservationInput;
  const reservation = await reservationService.updateReservation(id, body);
  res.status(200).json({ success: true, data: { reservation } });
});

export const deleteReservation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  await reservationService.deleteReservation(id);
  res.status(200).json({ success: true, data: null });
});

export const changeReservationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.validatedParams as { id: string };
  const body = req.validatedBody as ChangeReservationStatusInput;
  const reservation = await reservationService.changeReservationStatus(id, body);
  res.status(200).json({ success: true, data: { reservation } });
});