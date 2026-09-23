import type {
  ApiResponse,
  ChangePurchaseStatusInput,
  CreatePurchaseInput,
  ListPurchasesQuery,
  Paginated,
  PurchaseProfile,
  UpdatePurchaseInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Purchase orders (module 11) — PENDING orders against suppliers that on
 * RECEIVED bump inventory quantities and the ledger. Mutations other than
 * reading are manager/admin only.
 */
export const purchaseApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listPurchases: build.query<Paginated<PurchaseProfile>, ListPurchasesQuery | void>({
      query: (params) => ({ url: '/v1/purchases', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<PurchaseProfile>>) => response.data!,
      providesTags: (result) => [
        { type: 'Purchases', id: 'LIST' },
        ...(result?.items ?? []).map((purchase) => ({ type: 'Purchases' as const, id: purchase.id })),
      ],
    }),
    createPurchase: build.mutation<PurchaseProfile, CreatePurchaseInput>({
      query: (data) => ({ url: '/v1/purchases', method: 'POST', data }),
      transformResponse: (response: ApiResponse<{ purchase: PurchaseProfile }>) => response.data!.purchase,
      invalidatesTags: ['Purchases'],
    }),
    updatePurchase: build.mutation<PurchaseProfile, { id: string; data: UpdatePurchaseInput }>({
      query: ({ id, data }) => ({ url: `/v1/purchases/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ purchase: PurchaseProfile }>) => response.data!.purchase,
      invalidatesTags: ['Purchases'],
    }),
    deletePurchase: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/purchases/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Purchases'],
    }),
    changePurchaseStatus: build.mutation<PurchaseProfile, { id: string; data: ChangePurchaseStatusInput }>({
      query: ({ id, data }) => ({ url: `/v1/purchases/${id}/status`, method: 'POST', data }),
      transformResponse: (response: ApiResponse<{ purchase: PurchaseProfile }>) => response.data!.purchase,
      invalidatesTags: ['Purchases', 'InventoryItems', 'InventoryTransactions'],
    }),
  }),
});

export const {
  useListPurchasesQuery,
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
  useDeletePurchaseMutation,
  useChangePurchaseStatusMutation,
} = purchaseApi;