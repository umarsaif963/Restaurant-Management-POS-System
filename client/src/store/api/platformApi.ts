import type {
  ApiResponse,
  PlatformRestaurantProfile,
  PlatformStats,
  UpdatePlatformRestaurantInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Platform console endpoints. Only the platform super admin can reach them;
 * they read across restaurants and manage their subscription state.
 */
export const platformApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getPlatformStats: build.query<PlatformStats, void>({
      query: () => ({ url: '/v1/platform/stats', method: 'GET' }),
      transformResponse: (response: ApiResponse<PlatformStats>) => response.data!,
      providesTags: [{ type: 'Platform' as const, id: 'STATS' }],
    }),
    listPlatformRestaurants: build.query<
      PlatformRestaurantProfile[],
      { search?: string; status?: string; plan?: string } | void
    >({
      query: (params) => ({ url: '/v1/platform/restaurants', method: 'GET', params }),
      transformResponse: (
        response: ApiResponse<{ restaurants: PlatformRestaurantProfile[] }>,
      ) => response.data!.restaurants,
      providesTags: [{ type: 'Platform' as const, id: 'LIST' }],
    }),
    updatePlatformRestaurant: build.mutation<
      PlatformRestaurantProfile,
      { id: string; data: UpdatePlatformRestaurantInput }
    >({
      query: ({ id, data }) => ({
        url: `/v1/platform/restaurants/${id}`,
        method: 'PATCH',
        data,
      }),
      transformResponse: (
        response: ApiResponse<{ restaurant: PlatformRestaurantProfile }>,
      ) => response.data!.restaurant,
      invalidatesTags: [{ type: 'Platform', id: 'LIST' }, { type: 'Platform', id: 'STATS' }],
    }),
  }),
});

export const {
  useGetPlatformStatsQuery,
  useListPlatformRestaurantsQuery,
  useUpdatePlatformRestaurantMutation,
} = platformApi;
