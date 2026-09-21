import axios from 'axios';
import type { ApiResponse } from '@restaurant/shared';
import { env } from '@/config/env';

/**
 * Shared Axios instance used by the RTK Query base query and any direct calls.
 * `withCredentials` enables HTTP-only cookie auth (Phase 3+).
 */
export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export function extractApiError(error: unknown): { message: string; status?: number } {
  if (axios.isAxiosError<ApiResponse<never>>(error)) {
    return {
      message: error.response?.data?.message ?? error.message,
      status: error.response?.status,
    };
  }
  return { message: error instanceof Error ? error.message : 'Unexpected error' };
}