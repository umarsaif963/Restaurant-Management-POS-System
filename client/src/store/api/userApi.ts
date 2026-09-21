import type {
  ApiResponse,
  AuthUser,
  CreateUserInput,
  ListUsersQuery,
  Paginated,
  UpdateUserInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * User-management endpoints (module 3). Only accessible to MANAGER and ADMIN
 * (enforced server-side; the route is additionally hidden for other roles).
 */
export const userApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listUsers: build.query<Paginated<AuthUser>, ListUsersQuery | void>({
      query: (params) => ({ url: '/v1/users', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<AuthUser>>) => response.data!,
      providesTags: (result) => [
        { type: 'Users' as const, id: 'LIST' },
        ...(result?.items ?? []).map((user) => ({ type: 'Users' as const, id: user.id })),
      ],
    }),
    createUser: build.mutation<AuthUser, CreateUserInput>({
      query: (body) => ({ url: '/v1/users', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<{ user: AuthUser }>) => response.data!.user,
      invalidatesTags: [{ type: 'Users', id: 'LIST' }],
    }),
    updateUser: build.mutation<AuthUser, { id: string; data: UpdateUserInput }>({
      query: ({ id, data }) => ({ url: `/v1/users/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ user: AuthUser }>) => response.data!.user,
      invalidatesTags: (result, _error, arg) => [
        { type: 'Users', id: arg.id },
        { type: 'Users', id: 'LIST' },
        ...(result && result.id === arg.id ? [{ type: 'Me' } as const] : []),
      ],
    }),
    deactivateUser: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/users/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Users', id },
        { type: 'Users', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeactivateUserMutation,
} = userApi;