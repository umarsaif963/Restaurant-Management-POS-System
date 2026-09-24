import type {
  AnalyticsRangeQuery,
  ApiResponse,
  DashboardSummary,
  OrderAnalyticsReport,
  PaymentMethodReport,
  SalesReport,
  TopItemsQuery,
  TopSellingReport,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Dashboard + analytics (module 13) — read-only management views.
 * Summary drives the operation dashboard; the four report queries power the
 * Reports page. They are manager/admin only on the server, and refetch
 * automatically whenever the underlying data (orders, payments, inventory,
 * tables, reservations) changes through the other modules.
 */
export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    getDashboardSummary: build.query<DashboardSummary, void>({
      query: () => ({ url: '/v1/dashboard/summary', method: 'GET' }),
      transformResponse: (response: ApiResponse<DashboardSummary>) => response.data!,
      providesTags: ['Tables', 'InventoryItems', 'Reservations', 'Orders', 'Payments'],
    }),
    getSalesReport: build.query<SalesReport, AnalyticsRangeQuery | void>({
      query: (params) => ({ url: '/v1/analytics/sales', method: 'GET', params }),
      transformResponse: (response: ApiResponse<SalesReport>) => response.data!,
      providesTags: ['Orders'],
    }),
    getTopSellingItems: build.query<TopSellingReport, TopItemsQuery | void>({
      query: (params) => ({ url: '/v1/analytics/top-items', method: 'GET', params }),
      transformResponse: (response: ApiResponse<TopSellingReport>) => response.data!,
      providesTags: ['Orders'],
    }),
    getPaymentMethodsReport: build.query<PaymentMethodReport, AnalyticsRangeQuery | void>({
      query: (params) => ({ url: '/v1/analytics/payment-methods', method: 'GET', params }),
      transformResponse: (response: ApiResponse<PaymentMethodReport>) => response.data!,
      providesTags: ['Payments'],
    }),
    getOrderAnalyticsReport: build.query<OrderAnalyticsReport, AnalyticsRangeQuery | void>({
      query: (params) => ({ url: '/v1/analytics/orders', method: 'GET', params }),
      transformResponse: (response: ApiResponse<OrderAnalyticsReport>) => response.data!,
      providesTags: ['Orders'],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetSalesReportQuery,
  useGetTopSellingItemsQuery,
  useGetPaymentMethodsReportQuery,
  useGetOrderAnalyticsReportQuery,
} = analyticsApi;