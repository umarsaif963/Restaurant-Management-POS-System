import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from './baseQuery';

/**
 * Root API slice. Feature slices use `injectEndpoints` (or `enhanceEndpoints`)
 * so that all fetching flows through one store slice and one middleware.
 */
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery,
  tagTypes: ['Users', 'Me', 'Settings', 'Sections', 'Tables', 'Customers'],
  endpoints: () => ({}),
});