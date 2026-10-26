import {
  BarChart3,
  Boxes,
  CalendarDays,
  CreditCard,
  DollarSign,
  LayoutGrid,
  ReceiptText,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import type { ReactNode } from 'react';
import type { DashboardSummary, PaymentMethodReport, Permission, SalesReport } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import {
  useGetDashboardSummaryQuery,
  useGetPaymentMethodsReportQuery,
  useGetSalesReportQuery,
  useGetTopSellingItemsQuery,
} from '@/store/api/analyticsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { PAYMENT_METHOD_BADGE, PAYMENT_METHOD_LABELS } from '@/constants/payment';
import { formatMoney } from '@/utils/format';

function Metric({
  label,
  value,
  hint,
  accent = 'default',
  icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: 'default' | 'positive' | 'negative';
  icon?: ReactNode;
}) {
  const valueTone =
    accent === 'positive' ? 'text-brand-600' : accent === 'negative' ? 'text-red-600' : 'text-slate-900';
  const iconTone =
    accent === 'negative'
      ? 'bg-red-50 text-red-600'
      : accent === 'positive'
        ? 'bg-brand-50 text-brand-600'
        : 'bg-slate-100 text-slate-500';
  return (
    <div className="group rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card transition hover:border-slate-300/70 hover:shadow-lifted sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="min-h-[1.9rem] text-[11px] font-bold uppercase leading-[1.45] tracking-[0.1em] text-slate-400">
          {label}
        </p>
        {icon && (
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconTone}`}>
            {icon}
          </span>
        )}
      </div>
      <p className={`mt-2 text-[1.7rem] font-bold leading-none tracking-[-0.02em] ${valueTone}`}>
        {value}
      </p>
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

function MetricSkeleton() {
  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card sm:p-5">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-28" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}

function SalesBars({ items }: { items: SalesReport['items'] }) {
  const values = items.map((item) => Number(item.revenue));
  const max = Math.max(...values, 0);
  return (
    <div>
      <div className="flex h-44 items-end gap-1.5 border-b border-slate-100 sm:gap-2">
        {items.map((item) => {
          const height = max > 0 ? Math.max((Number(item.revenue) / max) * 100, 3) : 3;
          const isTop = max > 0 && Number(item.revenue) === max;
          return (
            <div
              key={item.date}
              className="group flex h-full flex-1 items-end"
              title={`${item.date} — ${item.orders} order${item.orders === 1 ? '' : 's'} · ${formatMoney(item.revenue)}`}
            >
              <div
                className={`w-full rounded-t-md transition-all duration-300 group-hover:opacity-80 ${
                  isTop ? 'bg-brand-500' : 'bg-brand-400/70'
                }`}
                style={{ height: `${height}%` }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-1.5 sm:gap-2">
        {items.map((item) => (
          <span key={item.date} className="flex-1 text-center text-[10px] text-slate-400">
            {item.date.slice(5)}
          </span>
        ))}
      </div>
    </div>
  );
}

function TablePills({ summary }: { summary: DashboardSummary }) {
  const buckets = [
    { label: 'Available', value: summary.tables.available, tone: 'bg-emerald-100 text-emerald-800' },
    { label: 'Reserved', value: summary.tables.reserved, tone: 'bg-sky-100 text-sky-800' },
    { label: 'Occupied', value: summary.tables.occupied, tone: 'bg-amber-100 text-amber-800' },
    { label: 'Cleaning', value: summary.tables.cleaning, tone: 'bg-slate-100 text-slate-700' },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {buckets.map((bucket) => (
        <span
          key={bucket.label}
          className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${bucket.tone}`}
        >
          {bucket.value} {bucket.label}
        </span>
      ))}
    </div>
  );
}

function PaymentRows({ report }: { report: PaymentMethodReport }) {
  if (report.items.length === 0) {
    return (
      <EmptyState
        icon={<CreditCard className="h-6 w-6" />}
        title="No payments recorded"
        description="Payments received in the selected window appear here."
      />
    );
  }
  return (
    <ul className="divide-y divide-slate-100">
      {report.items.map((item) => (
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
      <li className="flex items-center justify-between gap-3 pt-3">
        <span className="text-sm font-medium text-slate-500">Total</span>
        <span className="text-sm font-bold text-slate-900">{formatMoney(report.total)}</span>
      </li>
    </ul>
  );
}

export function DashboardPage() {
  const permissions = usePermissions();
  const can = (...needed: Permission[]) => needed.some((permission) => permissions.includes(permission));

  const {
    data: summary,
    isError,
    isFetching,
    isLoading,
    refetch,
  } = useGetDashboardSummaryQuery(undefined, { pollingInterval: 60_000 });
  // The report endpoints are guarded separately from the dashboard itself, so
  // they are only requested by an account that may read reports.
  const canViewReports = can('REPORTS_VIEW');
  const { data: sales } = useGetSalesReportQuery(undefined, { skip: !canViewReports });
  const { data: topItems } = useGetTopSellingItemsQuery({ limit: 5 }, { skip: !canViewReports });
  const { data: payments } = useGetPaymentMethodsReportQuery(undefined, { skip: !canViewReports });

  const metrics = [
    can('REPORTS_VIEW') && {
      key: 'revenue',
      label: 'Revenue today',
      value: formatMoney(summary?.today.revenue ?? '0'),
      hint: `${summary?.today.completedOrders ?? 0} order${
        summary?.today.completedOrders === 1 ? '' : 's'
      } completed today`,
      accent: Number(summary?.today.revenue ?? 0) > 0 ? ('positive' as const) : ('default' as const),
      icon: <DollarSign className="h-4 w-4" />,
    },
    can('ORDERS_READ') && {
      key: 'orders',
      label: 'Orders today',
      value: String(summary?.today.orders ?? 0),
      hint: `${summary?.today.openOrders ?? 0} still open`,
      icon: <ReceiptText className="h-4 w-4" />,
    },
    can('REPORTS_VIEW') && {
      key: 'aov',
      label: 'Avg order value',
      value: formatMoney(summary?.today.averageOrderValue ?? '0'),
      hint: 'completed orders today',
      icon: <TrendingUp className="h-4 w-4" />,
    },
    can('REPORTS_VIEW') && {
      key: 'received',
      label: 'Net received today',
      value: formatMoney(summary?.paymentsToday.netReceived ?? '0'),
      hint: `${summary?.paymentsToday.count ?? 0} payment${
        summary?.paymentsToday.count === 1 ? '' : 's'
      } recorded`,
      icon: <CreditCard className="h-4 w-4" />,
    },
    can('INVENTORY_READ') && {
      key: 'alerts',
      label: 'Inventory alerts',
      value: String((summary?.inventory.lowStock ?? 0) + (summary?.inventory.outOfStock ?? 0)),
      hint:
        (summary?.inventory.outOfStock ?? 0) > 0
          ? `${summary?.inventory.outOfStock} out of stock`
          : `${summary?.inventory.lowStock ?? 0} running low`,
      accent:
        (summary?.inventory.lowStock ?? 0) + (summary?.inventory.outOfStock ?? 0) > 0
          ? ('negative' as const)
          : ('positive' as const),
      icon: <Boxes className="h-4 w-4" />,
    },
  ].filter(Boolean) as {
    key: string;
    label: string;
    value: string;
    hint: string;
    accent?: 'default' | 'positive' | 'negative';
    icon: ReactNode;
  }[];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="A live overview of today's operation — revenue, tables, inventory and sales trends."
        actions={
          <button type="button" className="btn-secondary" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Spinner className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </button>
        }
      />

      {isError || !summary ? (
        <Card>
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-slate-500">Could not load the dashboard.</p>
            <button type="button" className="btn-secondary" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {metrics.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
              {isLoading ? (
                metrics.map((metric) => <MetricSkeleton key={metric.key} />)
              ) : (
                metrics.map((metric) => (
                  <Metric
                    key={metric.key}
                    label={metric.label}
                    value={metric.value}
                    hint={metric.hint}
                    accent={metric.accent}
                    icon={metric.icon}
                  />
                ))
              )}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {canViewReports && (
              <Card
                className="lg:col-span-2"
                title="Sales — last 7 days"
                icon={<TrendingUp className="h-4 w-4 text-slate-400" />}
                actions={
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <DollarSign className="h-3.5 w-3.5" />
                    {sales ? formatMoney(sales.items.reduce((sum, item) => sum + Number(item.revenue), 0)) : '—'}
                  </span>
                }
              >
                {!sales ? (
                  <div className="space-y-3">
                    <Skeleton className="h-3 w-2/3" />
                    <Skeleton className="h-40 w-full" />
                  </div>
                ) : (
                  <SalesBars items={sales.items} />
                )}
              </Card>
            )}

            {can('TABLES_READ') && (
              <Card title="Tables" icon={<LayoutGrid className="h-4 w-4 text-slate-400" />}>
                <TablePills summary={summary} />
                <p className="mt-4 text-xs text-slate-400">
                  {summary.tables.available} of {summary.tables.total} tables available right now.
                </p>
              </Card>
            )}

            {canViewReports && (
              <Card title="Top selling — last 30 days" icon={<BarChart3 className="h-4 w-4 text-slate-400" />}>
                {!topItems || topItems.items.length === 0 ? (
                  <EmptyState
                    icon={<BarChart3 className="h-6 w-6" />}
                    title="No sales data"
                    description="Completed orders are needed before items appear here."
                  />
                ) : (
                  <ol className="divide-y divide-slate-100">
                    {topItems.items.slice(0, 5).map((item, index) => (
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
            )}

            {canViewReports && (
              <Card
                title="Payments — last 30 days"
                icon={<CreditCard className="h-4 w-4 text-slate-400" />}
                actions={<TrendingUp className="h-4 w-4 text-slate-400" />}
              >
                {!payments ? (
                  <div className="space-y-3">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-3/4" />
                  </div>
                ) : (
                  <PaymentRows report={payments} />
                )}
              </Card>
            )}

            {can('RESERVATIONS_READ') && (
              <Card
                title="Reservations"
                icon={<CalendarDays className="h-4 w-4 text-slate-400" />}
                actions={<ReceiptText className="h-4 w-4 text-slate-400" />}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-600">Active today</span>
                    <span className="text-lg font-bold text-slate-900">{summary.reservations.today}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3">
                    <span className="text-sm font-medium text-slate-600">Upcoming</span>
                    <span className="text-lg font-bold text-slate-900">{summary.reservations.upcoming}</span>
                  </div>
                </div>
              </Card>
            )}

            {can('INVENTORY_READ') && (
              <Card
                title="Inventory health"
                icon={<Boxes className="h-4 w-4 text-slate-400" />}
                actions={<TrendingDown className="h-4 w-4 text-slate-400" />}
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-amber-50 px-4 py-3">
                    <p className="text-xs font-medium text-amber-700">Low stock</p>
                    <p className="mt-1 text-lg font-bold text-amber-800">{summary.inventory.lowStock}</p>
                  </div>
                  <div className="rounded-lg bg-red-50 px-4 py-3">
                    <p className="text-xs font-medium text-red-700">Out of stock</p>
                    <p className="mt-1 text-lg font-bold text-red-800">{summary.inventory.outOfStock}</p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}