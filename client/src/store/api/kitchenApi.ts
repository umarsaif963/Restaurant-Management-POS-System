import type {
  ApiResponse,
  KitchenOrderProfile,
  KitchenOrderStatus,
  ListKitchenOrdersQuery,
  Paginated,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Kitchen tickets (module 7). The ticket itself is minted automatically when
 * an order is confirmed (and appended to when items are added); this API only
 * reads tickets and advances their status.
 */
export const kitchenApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listKitchenOrders: build.query<Paginated<KitchenOrderProfile>, ListKitchenOrdersQuery | void>({
      query: (params) => ({ url: '/v1/kitchen-orders', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<KitchenOrderProfile>>) => response.data!,
      providesTags: (result) => [
        { type: 'KitchenOrders' as const, id: 'LIST' },
        ...(result?.items ?? []).map((ticket) => ({ type: 'KitchenOrders' as const, id: ticket.id })),
      ],
    }),
    getKitchenOrder: build.query<KitchenOrderProfile, string>({
      query: (id) => ({ url: `/v1/kitchen-orders/${id}`, method: 'GET' }),
      transformResponse: (response: ApiResponse<{ ticket: KitchenOrderProfile }>) => response.data!.ticket,
      providesTags: (_result, _error, id) => [{ type: 'KitchenOrders' as const, id }],
    }),
    updateKitchenOrderStatus: build.mutation<
      KitchenOrderProfile,
      { id: string; status: KitchenOrderStatus }
    >({
      query: ({ id, status }) => ({ url: `/v1/kitchen-orders/${id}/status`, method: 'POST', data: { status } }),
      transformResponse: (response: ApiResponse<{ ticket: KitchenOrderProfile }>) => response.data!.ticket,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'KitchenOrders', id: arg.id },
        { type: 'KitchenOrders', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListKitchenOrdersQuery,
  useGetKitchenOrderQuery,
  useUpdateKitchenOrderStatusMutation,
} = kitchenApi;