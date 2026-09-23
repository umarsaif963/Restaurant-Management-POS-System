import type {
  ApiResponse,
  ChangeReservationStatusInput,
  CreateReservationInput,
  ListReservationsQuery,
  Paginated,
  ReservationProfile,
  UpdateReservationInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Reservations (module 12) — booking list with a two-hour table window and a
 * PENDING → CONFIRMED → SEATED → COMPLETED (+ CANCELLED) state machine.
 * Status changes also flip table status (RESERVED / OCCUPIED / CLEANING), so
 * they invalidate the Tables tag alongside Reservations.
 * Create/edit/status are front-of-house; deletion is manager/admin only.
 */
export const reservationApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listReservations: build.query<Paginated<ReservationProfile>, ListReservationsQuery | void>({
      query: (params) => ({ url: '/v1/reservations', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<ReservationProfile>>) => response.data!,
      providesTags: (result) => [
        { type: 'Reservations', id: 'LIST' },
        ...(result?.items ?? []).map((reservation) => ({ type: 'Reservations' as const, id: reservation.id })),
      ],
    }),
    getReservation: build.query<ReservationProfile, string>({
      query: (id) => ({ url: `/v1/reservations/${id}`, method: 'GET' }),
      transformResponse: (response: ApiResponse<{ reservation: ReservationProfile }>) =>
        response.data!.reservation,
      providesTags: (_result, _error, id) => [{ type: 'Reservations', id }],
    }),
    createReservation: build.mutation<ReservationProfile, CreateReservationInput>({
      query: (data) => ({ url: '/v1/reservations', method: 'POST', data }),
      transformResponse: (response: ApiResponse<{ reservation: ReservationProfile }>) =>
        response.data!.reservation,
      invalidatesTags: ['Reservations', 'Tables'],
    }),
    updateReservation: build.mutation<
      ReservationProfile,
      { id: string; data: UpdateReservationInput }
    >({
      query: ({ id, data }) => ({ url: `/v1/reservations/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ reservation: ReservationProfile }>) =>
        response.data!.reservation,
      invalidatesTags: ['Reservations', 'Tables'],
    }),
    deleteReservation: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/reservations/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Reservations', 'Tables'],
    }),
    changeReservationStatus: build.mutation<
      ReservationProfile,
      { id: string; data: ChangeReservationStatusInput }
    >({
      query: ({ id, data }) => ({ url: `/v1/reservations/${id}/status`, method: 'POST', data }),
      transformResponse: (response: ApiResponse<{ reservation: ReservationProfile }>) =>
        response.data!.reservation,
      invalidatesTags: ['Reservations', 'Tables'],
    }),
  }),
});

export const {
  useListReservationsQuery,
  useGetReservationQuery,
  useCreateReservationMutation,
  useUpdateReservationMutation,
  useDeleteReservationMutation,
  useChangeReservationStatusMutation,
} = reservationApi;