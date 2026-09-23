import type { OrderProfile, PaymentProfile, RecordPaymentInput, RefundPaymentInput } from '@restaurant/shared';
import { apiSlice } from './apiSlice';

export const paymentApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listOrderPayments: build.query<PaymentProfile[], string>({
      query: (id) => ({ url: `/v1/orders/${id}/payments`, method: 'GET' }),
      transformResponse: (response: { data: { payments: PaymentProfile[] } }) => response.data.payments,
      providesTags: (_result, _error, id) => [{ type: 'Payments', id }],
    }),
    recordPayment: build.mutation<
      { order: OrderProfile; payment: PaymentProfile },
      { id: string } & RecordPaymentInput
    >({
      query: ({ id, ...body }) => ({
        url: `/v1/orders/${id}/payments`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Orders', id: arg.id },
        { type: 'Orders', id: 'LIST' },
        { type: 'Payments', id: arg.id },
      ],
    }),
    refundPayment: build.mutation<
      { order: OrderProfile; refund: PaymentProfile },
      { id: string; paymentId: string; body: RefundPaymentInput }
    >({
      query: ({ id, paymentId, body }) => ({
        url: `/v1/orders/${id}/payments/${paymentId}/refund`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Orders', id: arg.id },
        { type: 'Orders', id: 'LIST' },
        { type: 'Payments', id: arg.id },
      ],
    }),
  }),
});

export const {
  useListOrderPaymentsQuery,
  useRecordPaymentMutation,
  useRefundPaymentMutation,
} = paymentApi;
