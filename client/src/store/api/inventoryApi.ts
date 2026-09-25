import type {
  ApiResponse,
  CreateInventoryItemInput,
  InventoryItemProfile,
  InventoryTransactionProfile,
  ListInventoryItemsQuery,
  ListInventoryTransactionsQuery,
  Paginated,
  RecordInventoryTransactionInput,
  ReorderSuggestions,
  ReorderSuggestionsQuery,
  UpdateInventoryItemInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Inventory management (module 10) — items and the stock movement ledger.
 * Reads are available to every signed-in staff member; mutations are
 * manager/admin only.
 */
export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listInventoryItem: build.query<Paginated<InventoryItemProfile>, ListInventoryItemsQuery | void>({
      query: (params) => ({ url: '/v1/inventory/items', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<InventoryItemProfile>>) => response.data!,
      providesTags: (result) => [
        { type: 'InventoryItems', id: 'LIST' },
        ...(result?.items ?? []).map((item) => ({ type: 'InventoryItems' as const, id: item.id })),
      ],
    }),
    createInventoryItem: build.mutation<InventoryItemProfile, CreateInventoryItemInput>({
      query: (body) => ({ url: '/v1/inventory/items', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<{ item: InventoryItemProfile }>) => response.data!.item,
      invalidatesTags: ['InventoryItems'],
    }),
    updateInventoryItem: build.mutation<
      InventoryItemProfile,
      { id: string; data: UpdateInventoryItemInput }
    >({
      query: ({ id, data }) => ({ url: `/v1/inventory/items/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ item: InventoryItemProfile }>) => response.data!.item,
      invalidatesTags: ['InventoryItems'],
    }),
    deleteInventoryItem: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/inventory/items/${id}`, method: 'DELETE' }),
      invalidatesTags: ['InventoryItems', 'InventoryTransactions'],
    }),

    listInventoryTransactions: build.query<
      Paginated<InventoryTransactionProfile>,
      ListInventoryTransactionsQuery | void
    >({
      query: (params) => ({ url: '/v1/inventory/transactions', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<InventoryTransactionProfile>>) => response.data!,
      providesTags: ['InventoryTransactions'],
    }),
    getReorderSuggestions: build.query<ReorderSuggestions, ReorderSuggestionsQuery | void>({
      query: (params) => ({ url: '/v1/inventory/reorder-suggestions', method: 'GET', params }),
      transformResponse: (response: ApiResponse<ReorderSuggestions>) => response.data!,
      providesTags: ['InventoryItems'],
    }),
    recordInventoryTransaction: build.mutation<
      InventoryTransactionProfile,
      { itemId: string; data: RecordInventoryTransactionInput }
    >({
      query: ({ itemId, data }) => ({
        url: `/v1/inventory/items/${itemId}/transactions`,
        method: 'POST',
        data,
      }),
      transformResponse: (response: ApiResponse<{ transaction: InventoryTransactionProfile }>) =>
        response.data!.transaction,
      invalidatesTags: ['InventoryItems', 'InventoryTransactions'],
    }),
  }),
});

export const {
  useListInventoryItemQuery,
  useCreateInventoryItemMutation,
  useUpdateInventoryItemMutation,
  useDeleteInventoryItemMutation,
  useListInventoryTransactionsQuery,
  useRecordInventoryTransactionMutation,
  useGetReorderSuggestionsQuery,
} = inventoryApi;