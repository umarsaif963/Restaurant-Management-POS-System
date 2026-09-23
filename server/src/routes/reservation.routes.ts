import { Router } from 'express';
import { UserRole } from '@prisma/client';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import * as reservationController from '../controllers/reservation.controller.js';
import {
  changeReservationStatusSchema,
  createReservationSchema,
  listReservationsQuerySchema,
  reservationParamsSchema,
  updateReservationSchema,
} from '../validators/reservation.schema.js';

const router = Router();

router.use(authenticate());

// Booking is a front-of-house activity: any staff who can touch customers and
// orders can create, edit and drive reservations. Deletion is cleanup and is
// reserved for managers/admins.
const frontOfHouse = [UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER, UserRole.WAITER];
const managers = [UserRole.MANAGER, UserRole.ADMIN];

router.get(
  '/',
  validate({ query: listReservationsQuerySchema }),
  reservationController.listReservations,
);

router.get(
  '/:id',
  validate({ params: reservationParamsSchema }),
  reservationController.getReservation,
);

router.post(
  '/',
  authorize(...frontOfHouse),
  validate({ body: createReservationSchema }),
  reservationController.createReservation,
);

router.patch(
  '/:id',
  authorize(...frontOfHouse),
  validate({ params: reservationParamsSchema, body: updateReservationSchema }),
  reservationController.updateReservation,
);

router.post(
  '/:id/status',
  authorize(...frontOfHouse),
  validate({ params: reservationParamsSchema, body: changeReservationStatusSchema }),
  reservationController.changeReservationStatus,
);

router.delete(
  '/:id',
  authorize(...managers),
  validate({ params: reservationParamsSchema }),
  reservationController.deleteReservation,
);

export default router;