import type {
  ApiResponse,
  CreateEmployeeInput,
  CreateEmployeeResult,
  EmployeeProfile,
  ListEmployeesQuery,
  Paginated,
  ResetEmployeePasswordResult,
  UpdateEmployeeInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Employee management endpoints. Access is granted per permission
 * (`EMPLOYEES_READ` / `EMPLOYEES_WRITE`); the server is the authority, the
 * client only hides what the signed-in user cannot use.
 */
export const employeeApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listEmployees: build.query<Paginated<EmployeeProfile>, ListEmployeesQuery | void>({
      query: (params) => ({ url: '/v1/employees', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<EmployeeProfile>>) => response.data!,
      providesTags: (result) => [
        { type: 'Employees' as const, id: 'LIST' },
        ...(result?.items ?? []).map((employee) => ({
          type: 'Employees' as const,
          id: employee.id,
        })),
      ],
    }),
    getEmployee: build.query<EmployeeProfile, string>({
      query: (id) => ({ url: `/v1/employees/${id}`, method: 'GET' }),
      transformResponse: (response: ApiResponse<{ employee: EmployeeProfile }>) =>
        response.data!.employee,
      providesTags: (_result, _error, id) => [{ type: 'Employees' as const, id }],
    }),
    createEmployee: build.mutation<CreateEmployeeResult, CreateEmployeeInput>({
      query: (body) => ({ url: '/v1/employees', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<CreateEmployeeResult>) => response.data!,
      invalidatesTags: [{ type: 'Employees', id: 'LIST' }],
    }),
    updateEmployee: build.mutation<
      EmployeeProfile,
      { id: string; data: UpdateEmployeeInput }
    >({
      query: ({ id, data }) => ({ url: `/v1/employees/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ employee: EmployeeProfile }>) =>
        response.data!.employee,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'Employees', id: arg.id },
        { type: 'Employees', id: 'LIST' },
        ...(arg.data.email ? ([{ type: 'Me' as const }] as const) : []),
      ],
    }),
    deactivateEmployee: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Employees', id },
        { type: 'Employees', id: 'LIST' },
      ],
    }),
    reactivateEmployee: build.mutation<EmployeeProfile, string>({
      query: (id) => ({ url: `/v1/employees/${id}/reactivate`, method: 'POST' }),
      transformResponse: (response: ApiResponse<{ employee: EmployeeProfile }>) =>
        response.data!.employee,
      invalidatesTags: (_result, _error, id) => [
        { type: 'Employees', id },
        { type: 'Employees', id: 'LIST' },
      ],
    }),
    resetEmployeePassword: build.mutation<ResetEmployeePasswordResult, string>({
      query: (id) => ({ url: `/v1/employees/${id}/reset-password`, method: 'POST' }),
      transformResponse: (response: ApiResponse<ResetEmployeePasswordResult>) =>
        response.data!,
      invalidatesTags: (_result, _error, id) => [{ type: 'Employees', id }],
    }),
  }),
});

export const {
  useListEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeactivateEmployeeMutation,
  useReactivateEmployeeMutation,
  useResetEmployeePasswordMutation,
} = employeeApi;
