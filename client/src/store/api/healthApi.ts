import type { ApiResponse, HealthResponse } from '@restaurant/shared';
import { apiSlice } from './apiSlice';

export const healthApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getHealth: build.query<HealthResponse, void>({
      query: () => ({ url: '/v1/health', method: 'GET' }),
      transformResponse: (response: ApiResponse<HealthResponse>) => response.data as HealthResponse,
    }),
  }),
});

export const { useGetHealthQuery } = healthApi;