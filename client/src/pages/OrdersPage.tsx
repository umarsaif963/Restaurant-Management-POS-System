import { useEffect, useState } from 'react';
import { ClipboardList, Eye, RefreshCw, Search } from 'lucide-react';
import type { ListOrdersQuery, OrderStatus, OrderType, PaymentStatus } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { OrderDetailModal } from '@/components/orders/OrderDetailModal';
import { useListOrdersQuery } from '@/store/api/orderApi';
import { useDebounce } from '@/hooks/useDebounce';
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  ORDER_TYPE_BADGE,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABELS,
} from '@/constants/order';

const PAGE_SIZE = 20;

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [orderType, setOrderType] = useState<OrderType | ''>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [status, orderType, paymentStatus, debouncedSearch]);

  const query: ListOrdersQuery = {
    page,
    limit: PAGE_SIZE,
    status: status || undefined,
    orderType: orderType || undefined,
    paymentStatus: paymentStatus || undefined,
    search: debouncedSearch || undefined,
  };

  const { data, isFetching, refetch } = useListOrdersQuery(query);

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Point of sale — create, manage and fulfil customer orders."
        actions={
          <button type="button" className="btn-secondary" onClick={refetch} title="Refresh">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <Card>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={status === '' ? 'chip chip-active' : 'chip'}
              onClick={() => setStatus('')}
            >
              All statuses
            </button>
            {(['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'] as OrderStatus[]).map(
              (candidate) => (
                <button
                  key={candidate}
                  type="button"
                  className={status === candidate ? 'chip chip-active' : 'chip'}
                  onClick={() => setStatus(status === candidate ? '' : candidate)}
                >
                  {ORDER_STATUS_LABELS[candidate]}
                </button>
              ),
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={orderType === '' ? 'chip chip-active' : 'chip'}
                onClick={() => setOrderType('')}
              >
                All types
              </button>
              {(['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as OrderType[]).map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  className={orderType === candidate ? 'chip chip-active' : 'chip'}
                  onClick={() => setOrderType(orderType === candidate ? '' : candidate)}
                >
                  {ORDER_TYPE_LABELS[candidate]}
                </button>
              ))}
              <span className="mx-1 hidden w-px bg-slate-200 sm:block" />
              {(['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'] as PaymentStatus[]).map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  className={paymentStatus === candidate ? 'chip chip-active' : 'chip'}
                  onClick={() => setPaymentStatus(paymentStatus === candidate ? '' : candidate)}
                >
                  {PAYMENT_STATUS_LABELS[candidate]}
                </button>
              ))}
            </div>
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                className="input pl-9"
                placeholder="Order number, table, customer…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search orders"
              />
            </div>
          </div>
        </div>
      </Card>

      <div className="mt-4">
        {isFetching && !data ? (
          <Card>
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12" />
              ))}
            </div>
          </Card>
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon={<ClipboardList className="h-8 w-8" />}
            title="No orders found"
            description="Try widening your filters, or place an order from Point of Sale."
          />
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Payment</th>
                    <th className="px-4 py-3 font-semibold">Seat</th>
                    <th className="px-4 py-3 font-semibold">Items</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data?.items.map((order) => (
                    <tr key={order.id} className="text-slate-700 transition hover:bg-slate-50/70">
                      <td className="px-4 py-3 font-medium text-slate-900">{order.orderNumber}</td>
                      <td className="px-4 py-3">
                        <Badge variant={ORDER_TYPE_BADGE[order.orderType]}>
                          {ORDER_TYPE_LABELS[order.orderType]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ORDER_STATUS_BADGE[order.status]}>
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={PAYMENT_STATUS_BADGE[order.paymentStatus]}>
                          {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {order.orderType === 'DINE_IN' && order.tableNumber !== null
                          ? `Table ${String(order.tableNumber).padStart(2, '0')}`
                          : order.customerName ?? '—'}
                      </td>
                      <td className="px-4 py-3">{order.items.length}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">${order.grandTotal}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          className="rounded p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"
                          onClick={() => setActiveId(order.id)}
                          aria-label={`Open order ${order.orderNumber}`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && (
              <div className="border-t border-slate-100 px-4 py-3">
                <Pagination
                  page={page}
                  totalPages={Math.max(1, data.totalPages)}
                  total={data.total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </Card>
        )}
      </div>

      <OrderDetailModal orderId={activeId} onClose={() => setActiveId(null)} />
    </div>
  );
}