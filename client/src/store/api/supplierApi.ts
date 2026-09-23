import type {
  ApiResponse,
  CreateSupplierInput,
  ListSuppliersQuery,
  Paginated,
  SupplierProfile,
  UpdateSupplierInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Suppliers (module 11) — vendor contact book for purchase orders.
 * Reads are available to every signed-in staff member; mutations are
 * manager/admin only.
 */
export const supplierApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listSuppliers: build.query<Paginated<SupplierProfile>, ListSuppliersQuery | void>({
      query: (params) => ({ url: '/v1/suppliers', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<SupplierProfile>>) => response.data!,
      providesTags: (result) => [
        { type: 'Suppliers', id: 'LIST' },
        ...(result?.items ?? []).map((supplier) => ({ type: 'Suppliers' as const, id: supplier.id })),
      ],
    }),
    createSupplier: build.mutation<SupplierProfile, CreateSupplierInput>({
      query: (data) => ({ url: '/v1/suppliers', method: 'POST', data }),
      transformResponse: (response: ApiResponse<{ supplier: SupplierProfile }>) => response.data!.supplier,
      invalidatesTags: ['Suppliers'],
    }),
    updateSupplier: build.mutation<SupplierProfile, { id: string; data: UpdateSupplierInput }>({
      query: ({ id, data }) => ({ url: `/v1/suppliers/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ supplier: SupplierProfile }>) => response.data!.supplier,
      invalidatesTags: ['Suppliers'],
    }),
    deleteSupplier: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/suppliers/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Suppliers'],
    }),
  }),
});

export const {
  useListSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
} = supplierApi;