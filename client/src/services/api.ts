import axios, { type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '@restaurant/shared';
import { env } from '@/config/env';

/**
 * Shared Axios instance used by the RTK Query base query and any direct calls.
 * `withCredentials` sends the HTTP-only auth cookies (module 3).
 */
export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const AUTH_PATHS = /\/auth\/(login|refresh|logout|forgot-password|reset-password)/;

function isAuthPath(url?: string): boolean {
  return !!url && AUTH_PATHS.test(url);
}

/**
 * Registered callbacks invoked when a refresh attempt fails, i.e. the session
 * is genuinely dead. The store uses this to clear the cached user.
 */
const sessionExpiredCallbacks = new Set<() => void>();

export function onSessionExpired(callback: () => void): () => void {
  sessionExpiredCallbacks.add(callback);
  return () => {
    sessionExpiredCallbacks.delete(callback);
  };
}

function notifySessionExpired(): void {
  sessionExpiredCallbacks.forEach((callback) => callback());
}

let refreshPromise: Promise<unknown> | null = null;

function attemptRefresh(): Promise<unknown> {
  if (!refreshPromise) {
    refreshPromise = apiClient
      .post('/v1/auth/refresh')
      .catch((error) => {
        notifySessionExpired();
        throw error;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config as RetriableConfig | undefined;
    const status = error?.response?.status as number | undefined;

    if (status !== 401 || !config || config._retry || isAuthPath(config.url)) {
      return Promise.reject(error);
    }

    config._retry = true;
    try {
      await attemptRefresh();
      return apiClient(config);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  },
);

export function extractApiError(error: unknown): { message: string; status?: number } {
  if (axios.isAxiosError<ApiResponse<never>>(error)) {
    return {
      message: error.response?.data?.message ?? error.message,
      status: error.response?.status,
    };
  }
  return { message: error instanceof Error ? error.message : 'Unexpected error' };
}