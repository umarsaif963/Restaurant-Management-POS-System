import type { AxiosRequestConfig } from 'axios';
import axios from 'axios';
import type { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import type { ApiErrorItem } from '@restaurant/shared';
import { apiClient } from '@/services/api';

export type AxiosQueryArgs = AxiosRequestConfig;

export interface ApiErrorPayload {
  status: number;
  message: string;
  errors?: ApiErrorItem[];
}

/**
 * RTK Query base query powered by our shared Axios instance.
 * Unwraps the envelope into `data` on success, or a typed error payload.
 */
export const axiosBaseQuery: BaseQueryFn<AxiosQueryArgs, unknown, ApiErrorPayload> = async (args) => {
  try {
    const result = await apiClient.request(args);
    return { data: result.data };
  } catch (error) {
    if (axios.isAxiosError<{ message?: string; errors?: ApiErrorItem[] }>(error)) {
      return {
        error: {
          status: error.response?.status ?? 0,
          message: error.response?.data?.message ?? error.message,
          errors: error.response?.data?.errors,
        },
      };
    }
    return { error: { status: 0, message: 'Unexpected network error' } };
  }
};