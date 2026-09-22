import type {
  ApiResponse,
  AuthSessionData,
  AuthUser,
  ChangePasswordInput,
  ForgotPasswordInput,
  LoginInput,
  ResetPasswordInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

interface MessageData {
  message: string;
}

/**
 * Authentication endpoints (module 3). Session persistence is handled entirely
 * by HTTP-only cookies, so no tokens are ever stored on the client.
 */
export const authApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getMe: build.query<AuthUser, void>({
      query: () => ({ url: '/v1/auth/me', method: 'GET' }),
      transformResponse: (response: ApiResponse<AuthSessionData>) => response.data!.user,
      providesTags: [{ type: 'Me' }],
    }),
    login: build.mutation<AuthUser, LoginInput>({
      query: (body) => ({ url: '/v1/auth/login', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<AuthSessionData>) => response.data!.user,
      invalidatesTags: [{ type: 'Me' }],
    }),
    logout: build.mutation<void, void>({
      query: () => ({ url: '/v1/auth/logout', method: 'POST' }),
      invalidatesTags: [{ type: 'Me' }],
    }),
    changePassword: build.mutation<MessageData, ChangePasswordInput>({
      query: (body) => ({ url: '/v1/auth/change-password', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<never>) => ({
        message: response.message ?? 'Password changed',
      }),
    }),
    forgotPassword: build.mutation<MessageData, ForgotPasswordInput>({
      query: (body) => ({ url: '/v1/auth/forgot-password', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<never>) => ({
        message: response.message ?? 'Reset link sent',
      }),
    }),
    resetPassword: build.mutation<MessageData, ResetPasswordInput>({
      query: (body) => ({ url: '/v1/auth/reset-password', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<never>) => ({
        message: response.message ?? 'Password reset',
      }),
    }),
  }),
});

export const {
  useGetMeQuery,
  useLoginMutation,
  useLogoutMutation,
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} = authApi;