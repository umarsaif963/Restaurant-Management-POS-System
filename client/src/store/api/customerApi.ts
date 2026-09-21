import type {
  ApiResponse,
  CreateCustomerInput,
  CustomerProfile,
  ListCustomersQuery,
  Paginated,
  UpdateCustomerInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Customer directory (module 4). Readable/creatable by all front-of-house
 * staff; edits and deletes are manager/admin only.
 */
export const customerApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listCustomers: build.query<Paginated<CustomerProfile>, ListCustomersQuery | void>({
      query: (params) => ({ url: '/v1/customers', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<CustomerProfile>>) => response.data!,
      providesTags: (result) => [
        { type: 'Customers' as const, id: 'LIST' },
        ...(result?.items ?? []).map((customer) => ({ type: 'Customers' as const, id: customer.id })),
      ],
    }),
    createCustomer: build.mutation<CustomerProfile, CreateCustomerInput>({
      query: (body) => ({ url: '/v1/customers', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<{ customer: CustomerProfile }>) =>
        response.data!.customer,
      invalidatesTags: [{ type: 'Customers', id: 'LIST' }],
    }),
    updateCustomer: build.mutation<CustomerProfile, { id: string; data: UpdateCustomerInput }>({
      query: ({ id, data }) => ({ url: `/v1/customers/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ customer: CustomerProfile }>) =>
        response.data!.customer,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Customers', id: arg.id },
        { type: 'Customers', id: 'LIST' },
      ],
    }),
    deleteCustomer: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/customers/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Customers', id },
        { type: 'Customers', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListCustomersQuery,
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customerApi;