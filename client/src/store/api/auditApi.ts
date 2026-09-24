import type {
  ApiResponse,
  AuditLogProfile,
  ListAuditLogsQuery,
  Paginated,
  PurgeAuditLogsInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Audit trail (module 14) — manager/admin only. Every API request is
 * recorded server-side, so this slice is purely read + retention purge.
 */
export const auditApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listAuditLogs: build.query<Paginated<AuditLogProfile>, ListAuditLogsQuery | void>({
      query: (params) => ({ url: '/v1/audit-logs', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<AuditLogProfile>>) => response.data!,
      providesTags: (result) => [
        { type: 'AuditLogs', id: 'LIST' },
        ...(result?.items ?? []).map((entry) => ({ type: 'AuditLogs' as const, id: entry.id })),
      ],
    }),
    purgeAuditLogs: build.mutation<number, PurgeAuditLogsInput>({
      query: (data) => ({ url: '/v1/audit-logs', method: 'DELETE', data }),
      transformResponse: (response: ApiResponse<{ deleted: number }>) => response.data!.deleted,
      invalidatesTags: ['AuditLogs'],
    }),
  }),
});

export const { useListAuditLogsQuery, usePurgeAuditLogsMutation } = auditApi;