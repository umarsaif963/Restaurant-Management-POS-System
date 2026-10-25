import type {
  ApiResponse,
  CreateRoleInput,
  RoleProfile,
  UpdateRoleInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Custom role management. Roles describe exactly which permissions an
 * employee has and belong to the restaurant that created them.
 */
export const roleApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listRoles: build.query<RoleProfile[], void>({
      query: () => ({ url: '/v1/roles', method: 'GET' }),
      transformResponse: (response: ApiResponse<{ roles: RoleProfile[] }>) =>
        response.data!.roles,
      providesTags: [{ type: 'Roles' as const, id: 'LIST' }],
    }),
    getRole: build.query<RoleProfile, string>({
      query: (id) => ({ url: `/v1/roles/${id}`, method: 'GET' }),
      transformResponse: (response: ApiResponse<{ role: RoleProfile }>) => response.data!.role,
      providesTags: (_result, _error, id) => [{ type: 'Roles' as const, id }],
    }),
    createRole: build.mutation<RoleProfile, CreateRoleInput>({
      query: (body) => ({ url: '/v1/roles', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<{ role: RoleProfile }>) => response.data!.role,
      invalidatesTags: [{ type: 'Roles', id: 'LIST' }],
    }),
    updateRole: build.mutation<RoleProfile, { id: string; data: UpdateRoleInput }>({
      query: ({ id, data }) => ({ url: `/v1/roles/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ role: RoleProfile }>) => response.data!.role,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Roles', id: arg.id },
        { type: 'Roles', id: 'LIST' },
        { type: 'Employees', id: 'LIST' },
      ],
    }),
    deleteRole: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/roles/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Roles', id },
        { type: 'Roles', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useListRolesQuery,
  useGetRoleQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;
