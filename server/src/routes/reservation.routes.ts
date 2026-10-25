import { Router } from 'express';
import { authenticate } from '../middleware/authenticate.js';
import { requirePermission } from '../middleware/permissions.js';
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
router.get(
  '/',
  requirePermission('RESERVATIONS_READ'),
  validate({ query: listReservationsQuerySchema }),
  reservationController.listReservations,
);

router.get(
  '/:id',
  requirePermission('RESERVATIONS_READ'),
  validate({ params: reservationParamsSchema }),
  reservationController.getReservation,
);

router.post(
  '/',
  requirePermission('RESERVATIONS_WRITE'),
  validate({ body: createReservationSchema }),
  reservationController.createReservation,
);

router.patch(
  '/:id',
  requirePermission('RESERVATIONS_WRITE'),
  validate({ params: reservationParamsSchema, body: updateReservationSchema }),
  reservationController.updateReservation,
);

router.post(
  '/:id/status',
  requirePermission('RESERVATIONS_WRITE'),
  validate({ params: reservationParamsSchema, body: changeReservationStatusSchema }),
  reservationController.changeReservationStatus,
);

router.delete(
  '/:id',
  requirePermission('RESERVATIONS_WRITE'),
  validate({ params: reservationParamsSchema }),
  reservationController.deleteReservation,
);

export default router;
