import { useState } from 'react';
import { ChefHat, Printer, RefreshCw } from 'lucide-react';
import type { KitchenOrderStatus } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import {
  useListKitchenOrdersQuery,
  useUpdateKitchenOrderStatusMutation,
} from '@/store/api/kitchenApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import {
  KITCHEN_NEXT,
  KITCHEN_OPERATOR_ROLES,
  KITCHEN_STATUS_BADGE,
  KITCHEN_STATUS_LABELS,
} from '@/constants/kitchen';
import { ORDER_STATUS_LABELS, ORDER_TYPE_BADGE, ORDER_TYPE_LABELS } from '@/constants/order';

const PAGE_SIZE = 50;

const ALL_KITCHEN_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'] as const;

export function KitchenOrdersPage() {
  const toast = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canOperate = currentUser ? KITCHEN_OPERATOR_ROLES.includes(currentUser.role as (typeof KITCHEN_OPERATOR_ROLES)[number]) : false;

  const [status, setStatus] = useState<KitchenOrderStatus | ''>('');
  const [page, setPage] = useState(1);

  const { data, isFetching, refetch } = useListKitchenOrdersQuery({
    page,
    limit: PAGE_SIZE,
    status: status || undefined,
  });

  const [advance, { isLoading: advancing }] = useUpdateKitchenOrderStatusMutation();

  async function handleAdvance(id: string, next: KitchenOrderStatus) {
    try {
      const ticket = await advance({ id, status: next }).unwrap();
      toast.success(
        'Ticket updated',
        `Ticket #${ticket.ticketNumber} of ${ticket.orderNumber} is now ${KITCHEN_STATUS_LABELS[next].toLowerCase()}.`,
      );
    } catch (error) {
      toast.error('Could not update ticket', error instanceof Error ? error.message : 'The transition was rejected.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Kitchen"
        description="Live production tickets — confirmed orders land here automatically."
        actions={
          <button type="button" className="btn-secondary" onClick={refetch} title="Refresh">
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        }
      />

      <Card>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={status === '' ? 'chip chip-active' : 'chip'}
            onClick={() => setStatus('')}
          >
            All tickets
          </button>
          {ALL_KITCHEN_STATUSES.map((candidate) => (
            <button
              key={candidate}
              type="button"
              className={status === candidate ? 'chip chip-active' : 'chip'}
              onClick={() => setStatus(status === candidate ? '' : candidate)}
            >
              {KITCHEN_STATUS_LABELS[candidate]}
            </button>
          ))}
        </div>
      </Card>

      <div className="mt-4">
        {isFetching && !data ? (
          <Card>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-28" />
              ))}
            </div>
          </Card>
        ) : (data?.items.length ?? 0) === 0 ? (
          <EmptyState
            icon={<ChefHat className="h-8 w-8" />}
            title="No kitchen tickets"
            description="Tickets appear here as soon as an order is confirmed."
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {data?.items.map((ticket) => (
                <Card key={ticket.id} className="border-l-4 !border-l-brand-500">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900">
                          {ticket.orderNumber}
                          {ticket.ticketNumber > 1 && (
                            <span className="ml-1 text-xs font-medium text-slate-400">
                              (ticket #{ticket.ticketNumber})
                            </span>
                          )}
                        </h3>
                        <Badge variant={ORDER_TYPE_BADGE[ticket.orderType]}>
                          {ORDER_TYPE_LABELS[ticket.orderType]}
                        </Badge>
                        <Badge variant={KITCHEN_STATUS_BADGE[ticket.status]}>
                          {KITCHEN_STATUS_LABELS[ticket.status]}
                        </Badge>
                        <Badge variant="slate">{ORDER_STATUS_LABELS[ticket.orderStatus]}</Badge>
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {ticket.tableNumber !== null
                          ? `Table ${String(ticket.tableNumber).padStart(2, '0')}`
                          : ticket.customerName ?? 'Walk-in'}
                        {' · '}
                        {new Date(ticket.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {ticket.acceptedByName && ` · accepted by ${ticket.acceptedByName}`}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <a
                        href={`/print/kitchen/${ticket.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-secondary px-3 py-1.5 text-xs"
                        title="Print kitchen ticket"
                      >
                        <Printer className="h-3.5 w-3.5" />
                        Print
                      </a>
                    </div>
                  </div>

                  {ticket.notes && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                      {ticket.notes}
                    </p>
                  )}

                  <ul className="mt-3 space-y-1.5">
                    {ticket.items.map((item) => (
                      <li key={item.id} className="flex items-baseline gap-2 text-sm">
                        <span className="font-semibold text-slate-800">{item.quantity}×</span>
                        <span className="font-medium text-slate-800">{item.name}</span>
                        {item.variant && <span className="text-xs text-slate-500">{item.variant}</span>}
                        {item.notes && <span className="text-xs italic text-slate-400">“{item.notes}”</span>}
                        <span className="ml-auto shrink-0">
                          <Badge variant={item.status === 'CANCELLED' ? 'red' : 'slate'}>{item.status}</Badge>
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                    {canOperate &&
                      KITCHEN_NEXT[ticket.status].map((next) => (
                        <button
                          key={next}
                          type="button"
                          disabled={advancing}
                          className={next === 'CANCELLED' ? 'btn-danger px-3 py-1.5 text-xs' : 'btn-primary px-3 py-1.5 text-xs'}
                          onClick={() => handleAdvance(ticket.id, next)}
                        >
                          {KITCHEN_STATUS_LABELS[next]}
                        </button>
                      ))}
                    {KITCHEN_NEXT[ticket.status].length === 0 && (
                      <p className="text-xs text-slate-400">Ticket {KITCHEN_STATUS_LABELS[ticket.status].toLowerCase()}.</p>
                    )}
                    {!canOperate && KITCHEN_NEXT[ticket.status].length > 0 && (
                      <p className="text-xs text-slate-400">Waiting on the kitchen.</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
            {data && (
              <div className="mt-4">
                <Pagination
                  page={page}
                  totalPages={Math.max(1, data.totalPages)}
                  total={data.total}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}