import type { ApiResponse, SettingsView, UpdateSettingsInput } from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Restaurant configuration (module 4). Single tenant — one Restaurant row plus
 * its RestaurantSettings.
 */
export const settingsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getSettings: build.query<SettingsView, void>({
      query: () => ({ url: '/v1/settings', method: 'GET' }),
      transformResponse: (response: ApiResponse<SettingsView>) => response.data!,
      providesTags: ['Settings'],
    }),
    updateSettings: build.mutation<SettingsView, UpdateSettingsInput>({
      query: (body) => ({ url: '/v1/settings', method: 'PATCH', data: body }),
      transformResponse: (response: ApiResponse<SettingsView>) => response.data!,
      invalidatesTags: ['Settings'],
    }),
  }),
});

export const { useGetSettingsQuery, useUpdateSettingsMutation } = settingsApi;