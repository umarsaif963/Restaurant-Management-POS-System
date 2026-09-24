import { useCallback, useMemo, useState } from 'react';
import { skipToken } from '@reduxjs/toolkit/query/react';
import { BarChart3, CreditCard, Download, ReceiptText, TrendingUp } from 'lucide-react';
import type { OrderAnalyticsReport, SalesReport } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import {
  useGetOrderAnalyticsReportQuery,
  useGetPaymentMethodsReportQuery,
  useGetSalesReportQuery,
  useGetTopSellingItemsQuery,
} from '@/store/api/analyticsApi';
import { ORDER_STATUS_BADGE, ORDER_STATUS_LABELS, ORDER_TYPE_BADGE, ORDER_TYPE_LABELS } from '@/constants/order';
import { PAYMENT_METHOD_BADGE, PAYMENT_METHOD_LABELS } from '@/constants/payment';
import { formatMoney } from '@/utils/format';

function utcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDaysUtc(dateStr: string, days: number): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return utcDateString(new Date(Date.UTC(year, month - 1, day + days)));
}

function exportSalesCsv(items: SalesReport['items'], from: string, to: string) {
  const header = 'Date,Orders,Revenue,Average Order Value';
  const rows = items.map((item) => [item.date, item.orders, item.revenue, item.averageOrderValue].join(','));
  const blob = new Blob([`${header}\n${rows.join('\n')}\n`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sales-report-${from}-to-${to}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const PRESETS = [
  { label: 'Last 7 days', days: 6 },
  { label: 'Last 30 days', days: 29 },
  { label: 'Last 90 days', days: 89 },
];

export function ReportsPage() {
  const [from, setFrom] = useState(() => addDaysUtc(utcDateString(new Date()), -6));
  const [to, setTo] = useState(() => utcDateString(new Date()));
  const [limit, setLimit] = useState(10);

  const validRange = from && to && from <= to;
  const range = useMemo(
    () => (validRange ? { from: `${from}T00:00:00.000Z`, to: `${addDaysUtc(to, 1)}T00:00:00.000Z` } : null),
    [from, to, validRange],
  );

  const { data: sales } = useGetSalesReportQuery(range ?? skipToken);
  const { data: topItems } = useGetTopSellingItemsQuery(range ? { ...range, limit } : skipToken);
  const { data: payments } = useGetPaymentMethodsReportQuery(range ?? skipToken);
  const { data: breakdown } = useGetOrderAnalyticsReportQuery(range ?? skipToken);

  const totals = useMemo(() => {
    const items = sales?.items ?? [];
    const revenue = items.reduce((sum, item) => sum + Number(item.revenue), 0);
    const orders = items.reduce((sum, item) => sum + item.orders, 0);
    return { revenue, orders, average: orders > 0 ? revenue / orders : 0 };
  }, [sales]);

  const handlePreset = useCallback((days: number) => {
    const toDate = utcDateString(new Date());
    setTo(toDate);
    setFrom(addDaysUtc(toDate, -days));
  }, []);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Sales, top items, payment methods and order mix over a date range (UTC day buckets)."
        actions={
          sales && sales.items.length > 0 ? (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => exportSalesCsv(sales.items, from, to)}
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="report-from" className="mb-1 block text-xs font-medium text-slate-500">
              From
            </label>
            <input
              id="report-from"
              type="date"
              className="input"
              value={from}
              max={to}
              onChange={(event) => setFrom(event.target.value)}
              aria-label="Report start date"
            />
          </div>
          <div>
            <label htmlFor="report-to" className="mb-1 block text-xs font-medium text-slate-500">
              To
            </label>
            <input
              id="report-to"
              type="date"
              className="input"
              value={to}
              min={from}
              onChange={(event) => setTo(event.target.value)}
              aria-label="Report end date"
            />
          </div>
          <div>
            <label htmlFor="report-limit" className="mb-1 block text-xs font-medium text-slate-500">
              Top items
            </label>
            <select
              id="report-limit"
              className="input w-auto"
              value={limit}
              onChange={(event) => setLimit(Number(event.target.value))}
              aria-label="Number of top items"
            >
              {[5, 10, 25, 50].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="btn-secondary"
                onClick={() => handlePreset(preset.days)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
        {!validRange && <p className="mt-3 text-sm text-red-600">“From” must be on or before “To”.</p>}
      </Card>

      {validRange ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card
            className="lg:col-span-2"
            title="Sales by day"
            icon={<TrendingUp className="h-4 w-4 text-slate-400" />}
            actions={
              <div className="text-right text-xs text-slate-400">
                <p>
                  <span className="font-semibold text-slate-700">{formatMoney(totals.revenue)}</span> total
                </p>
                <p>
                  {totals.orders} orders · avg {formatMoney(totals.average)}
                </p>
              </div>
            }
          >
            {!sales ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            ) : sales.items.length === 0 ? (
              <EmptyState
                icon={<TrendingUp className="h-6 w-6" />}
                title="No sales in this range"
                description="Completed orders within the selected dates appear here."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Date</th>
                      <th className="px-3 py-2 text-right font-semibold">Orders</th>
                      <th className="px-3 py-2 text-right font-semibold">Revenue</th>
                      <th className="px-3 py-2 text-right font-semibold">Avg order</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {sales.items.map((item) => (
                      <tr key={item.date}>
                        <td className="px-3 py-2.5 font-medium text-slate-700">{item.date}</td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{item.orders}</td>
                        <td className="px-3 py-2.5 text-right font-semibold text-slate-800">
                          {formatMoney(item.revenue)}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-600">{formatMoney(item.averageOrderValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card title="Top selling items" icon={<BarChart3 className="h-4 w-4 text-slate-400" />}>
            {!topItems ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ) : topItems.items.length === 0 ? (
              <EmptyState
                icon={<BarChart3 className="h-6 w-6" />}
                title="No items sold"
                description="Completed orders within the selected dates are needed."
              />
            ) : (
              <ol className="divide-y divide-slate-100">
                {topItems.items.map((item, index) => (
                  <li key={item.menuItemId} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-500">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-400">
                          {item.quantity} sold · {item.orders} order{item.orders === 1 ? '' : 's'}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{formatMoney(item.revenue)}</span>
                  </li>
                ))}
              </ol>
            )}
          </Card>

          <Card
            title="Payment methods"
            icon={<CreditCard className="h-4 w-4 text-slate-400" />}
            actions={payments ? <Badge variant="slate">{formatMoney(payments.total)} total</Badge> : undefined}
          >
            {!payments ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ) : payments.items.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="h-6 w-6" />}
                title="No payments recorded"
                description="Payments within the selected dates appear here (net of refunds)."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {payments.items.map((item) => (
                  <li key={item.method} className="flex items-center justify-between gap-3 py-2.5">
                    <Badge variant={PAYMENT_METHOD_BADGE[item.method]}>{PAYMENT_METHOD_LABELS[item.method]}</Badge>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-800">{formatMoney(item.amount)}</p>
                      <p className="text-xs text-slate-400">
                        {item.count} payment{item.count === 1 ? '' : 's'}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            className="lg:col-span-2"
            title="Order mix"
            icon={<ReceiptText className="h-4 w-4 text-slate-400" />}
            actions={breakdown ? <Badge variant="slate">{formatMoney(breakdownTotal(breakdown))} total</Badge> : undefined}
          >
            {!breakdown ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-3/4" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">By status</h3>
                  <ul className="space-y-2">
                    {breakdown.statuses.map((row) => (
                      <li key={row.status} className="flex items-center justify-between gap-3">
                        <Badge variant={ORDER_STATUS_BADGE[row.status]}>{ORDER_STATUS_LABELS[row.status]}</Badge>
                        <span className="text-sm font-semibold text-slate-800">{row.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">By type</h3>
                  <ul className="space-y-2">
                    {breakdown.types.map((row) => (
                      <li
                        key={row.type}
                        className="flex items-center justify-between gap-3 border-b border-slate-50 pb-2"
                      >
                        <Badge variant={ORDER_TYPE_BADGE[row.type]}>{ORDER_TYPE_LABELS[row.type]}</Badge>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-800">{row.count} orders</p>
                          <p className="text-xs text-slate-400">{formatMoney(row.revenue)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </Card>
        </div>
      ) : null}
    </div>
  );
}

function breakdownTotal(report: OrderAnalyticsReport): number {
  return report.types.reduce((sum, type) => sum + Number(type.revenue), 0);
}