import type {
  AddOrderItemsInput,
  ApiResponse,
  CreateOrderInput,
  InventoryTransactionProfile,
  ListOrdersQuery,
  OrderProfile,
  Paginated,
  ReceiptView,
  UpdateOrderInput,
  UpdateOrderStatusInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Orders — the point of sale (module 6). Each order response carries the full
 * line-item snapshot, so any mutation invalidates the whole Orders list AND the
 * affected room state (tables/customers) that an order touches on its lifecycle.
 */
export const orderApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listOrders: build.query<Paginated<OrderProfile>, ListOrdersQuery | void>({
      query: (params) => ({ url: '/v1/orders', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<OrderProfile>>) => response.data!,
      providesTags: (result) => [
        { type: 'Orders' as const, id: 'LIST' },
        ...(result?.items ?? []).map((order) => ({ type: 'Orders' as const, id: order.id })),
      ],
    }),
    getOrder: build.query<OrderProfile, string>({
      query: (id) => ({ url: `/v1/orders/${id}`, method: 'GET' }),
      transformResponse: (response: ApiResponse<{ order: OrderProfile }>) => response.data!.order,
      providesTags: (_result, _error, id) => [{ type: 'Orders' as const, id }],
    }),
    getReceipt: build.query<ReceiptView, string>({
      query: (id) => ({ url: `/v1/orders/${id}/receipt`, method: 'GET' }),
      transformResponse: (response: ApiResponse<{ receipt: ReceiptView }>) => response.data!.receipt,
      providesTags: (_result, _error, id) => [{ type: 'Orders' as const, id }],
    }),
    getOrderInventoryMovements: build.query<{ items: InventoryTransactionProfile[] }, string>({
      query: (id) => ({ url: `/v1/orders/${id}/inventory-movements`, method: 'GET' }),
      transformResponse: (response: ApiResponse<{ items: InventoryTransactionProfile[] }>) => response.data!,
      providesTags: (_result, _error, id) => [{ type: 'Orders' as const, id }],
    }),
    createOrder: build.mutation<OrderProfile, CreateOrderInput>({
      query: (body) => ({ url: '/v1/orders', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<{ order: OrderProfile }>) => response.data!.order,
      invalidatesTags: ['Orders', 'Tables', 'Customers'],
    }),
    updateOrder: build.mutation<OrderProfile, { id: string; data: UpdateOrderInput }>({
      query: ({ id, data }) => ({ url: `/v1/orders/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ order: OrderProfile }>) => response.data!.order,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Orders', id: arg.id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    addOrderItems: build.mutation<OrderProfile, { id: string; data: AddOrderItemsInput }>({
      query: ({ id, data }) => ({ url: `/v1/orders/${id}/items`, method: 'POST', data }),
      transformResponse: (response: ApiResponse<{ order: OrderProfile }>) => response.data!.order,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Orders', id: arg.id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    removeOrderItem: build.mutation<OrderProfile, { id: string; itemId: string }>({
      query: ({ id, itemId }) => ({ url: `/v1/orders/${id}/items/${itemId}`, method: 'DELETE' }),
      transformResponse: (response: ApiResponse<{ order: OrderProfile }>) => response.data!.order,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Orders', id: arg.id },
        { type: 'Orders', id: 'LIST' },
      ],
    }),
    updateOrderStatus: build.mutation<OrderProfile, { id: string; data: UpdateOrderStatusInput }>({
      query: ({ id, data }) => ({ url: `/v1/orders/${id}/status`, method: 'POST', data }),
      transformResponse: (response: ApiResponse<{ order: OrderProfile }>) => response.data!.order,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Orders', id: arg.id },
        { type: 'Orders', id: 'LIST' },
        ...(arg.data.status === 'COMPLETED' || arg.data.status === 'CANCELLED'
          ? (['Tables', 'Customers'] as const)
          : []),
      ],
    }),
  }),
});

export const {
  useListOrdersQuery,
  useGetOrderQuery,
  useGetReceiptQuery,
  useGetOrderInventoryMovementsQuery,
  useCreateOrderMutation,
  useUpdateOrderMutation,
  useAddOrderItemsMutation,
  useRemoveOrderItemMutation,
  useUpdateOrderStatusMutation,
} = orderApi;