import type {
  ApiResponse,
  CreateTableInput,
  CreateTableSectionInput,
  ListTablesQuery,
  RestaurantTableProfile,
  TableSectionProfile,
  UpdateTableInput,
  UpdateTableSectionInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Floor plan — table sections and tables (module 4). Section changes also
 * ripple into the tables list, so both tag families are invalidated together.
 */
export const tableApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listSections: build.query<TableSectionProfile[], void>({
      query: () => ({ url: '/v1/tables/sections', method: 'GET' }),
      transformResponse: (response: ApiResponse<{ sections: TableSectionProfile[] }>) =>
        response.data!.sections,
      providesTags: ['Sections'],
    }),
    createSection: build.mutation<TableSectionProfile, CreateTableSectionInput>({
      query: (body) => ({ url: '/v1/tables/sections', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<{ section: TableSectionProfile }>) =>
        response.data!.section,
      invalidatesTags: ['Sections', 'Tables'],
    }),
    updateSection: build.mutation<TableSectionProfile, { id: string; data: UpdateTableSectionInput }>({
      query: ({ id, data }) => ({ url: `/v1/tables/sections/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ section: TableSectionProfile }>) =>
        response.data!.section,
      invalidatesTags: ['Sections', 'Tables'],
    }),
    deleteSection: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/tables/sections/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Sections', 'Tables'],
    }),
    listTables: build.query<RestaurantTableProfile[], ListTablesQuery | void>({
      query: (params) => ({ url: '/v1/tables', method: 'GET', params }),
      transformResponse: (response: ApiResponse<{ tables: RestaurantTableProfile[] }>) =>
        response.data!.tables,
      providesTags: ['Tables'],
    }),
    createTable: build.mutation<RestaurantTableProfile, CreateTableInput>({
      query: (body) => ({ url: '/v1/tables', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<{ table: RestaurantTableProfile }>) =>
        response.data!.table,
      invalidatesTags: ['Tables', 'Sections'],
    }),
    updateTable: build.mutation<RestaurantTableProfile, { id: string; data: UpdateTableInput }>({
      query: ({ id, data }) => ({ url: `/v1/tables/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ table: RestaurantTableProfile }>) =>
        response.data!.table,
      invalidatesTags: ['Tables'],
    }),
    deleteTable: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/tables/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Tables', 'Sections'],
    }),
  }),
});

export const {
  useListSectionsQuery,
  useCreateSectionMutation,
  useUpdateSectionMutation,
  useDeleteSectionMutation,
  useListTablesQuery,
  useCreateTableMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
} = tableApi;