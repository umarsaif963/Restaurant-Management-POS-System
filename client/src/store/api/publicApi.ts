import type {
  ApiResponse,
  ContactMessageInput,
  ContactMessageProfile,
  RegisterRestaurantInput,
  RegisterRestaurantResponse,
  SubscriptionPlanProfile,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Endpoints that are reachable without an account: the public pricing catalog
 * and the restaurant sign-up that creates a workspace and its owner.
 */
export const publicApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listPlans: build.query<SubscriptionPlanProfile[], void>({
      query: () => ({ url: '/v1/public/plans', method: 'GET' }),
      transformResponse: (
        response: ApiResponse<{ plans: SubscriptionPlanProfile[] }>,
      ) => response.data!.plans,
    }),
    registerRestaurant: build.mutation<RegisterRestaurantResponse, RegisterRestaurantInput>({
      query: (body) => ({ url: '/v1/public/register', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<RegisterRestaurantResponse>) => response.data!,
    }),
    submitContactMessage: build.mutation<ContactMessageProfile, ContactMessageInput>({
      query: (body) => ({ url: '/v1/public/contact', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<{ message: ContactMessageProfile }>) => response.data!.message,
    }),
  }),
});

export const { useListPlansQuery, useRegisterRestaurantMutation, useSubmitContactMessageMutation } = publicApi;
