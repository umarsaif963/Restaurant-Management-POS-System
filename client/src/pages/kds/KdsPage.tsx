import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MonitorPlay, RefreshCw } from 'lucide-react';
import type { KitchenOrderProfile, KitchenOrderStatus } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { useListKitchenOrdersQuery, useUpdateKitchenOrderStatusMutation } from '@/store/api/kitchenApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { extractApiError } from '@/services/api';
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus';
import {
  KITCHEN_NEXT,
  KITCHEN_OPERATOR_ROLES,
  KITCHEN_STATUS_LABELS,
} from '@/constants/kitchen';
import { ORDER_TYPE_BADGE, ORDER_TYPE_LABELS } from '@/constants/order';

const BOARD_PAGE_SIZE = 250;
const POLL_FALLBACK_MS = 60_000;

interface Column {
  key: string;
  label: string;
  statuses: KitchenOrderStatus[];
}

const COLUMNS: Column[] = [
  { key: 'waiting', label: 'Waiting', statuses: ['PENDING', 'ACCEPTED'] },
  { key: 'preparing', label: 'Preparing', statuses: ['PREPARING'] },
  { key: 'ready', label: 'Ready', statuses: ['READY'] },
  { key: 'served', label: 'Served', statuses: ['SERVED'] },
];

const MUTED_STATUSES: KitchenOrderStatus[] = ['COMPLETED', 'CANCELLED'];

const TILE_ACCENT: Partial<Record<KitchenOrderStatus, string>> = {
  PENDING: '!border-l-amber-400',
  ACCEPTED: '!border-l-amber-400',
  PREPARING: '!border-l-sky-400',
  READY: '!border-l-emerald-500',
  SERVED: '!border-l-slate-300',
  COMPLETED: '!border-l-slate-300',
  CANCELLED: '!border-l-red-300',
};

function formatElapsed(createdAt: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s).padStart(2, '0')}s`;
}

function TicketTile({
  ticket,
  now,
  canOperate,
  advancing,
  onAdvance,
}: {
  ticket: KitchenOrderProfile;
  now: number;
  canOperate: boolean;
  advancing: boolean;
  onAdvance: (id: string, status: KitchenOrderStatus) => void;
}) {
  return (
    <Card className={`border-l-4 ${TILE_ACCENT[ticket.status] ?? '!border-l-slate-300'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              {ticket.tableNumber !== null ? `T${String(ticket.tableNumber).padStart(2, '0')}` : ticket.orderNumber}
            </h3>
            <Badge variant={ORDER_TYPE_BADGE[ticket.orderType]}>{ORDER_TYPE_LABELS[ticket.orderType]}</Badge>
            <Badge variant="slate">ticket #{ticket.ticketNumber}</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            {ticket.tableNumber !== null ? `Table ${String(ticket.tableNumber).padStart(2, '0')}` : ticket.customerName ?? 'Walk-in'}
            {' · '}
            <span className="font-mono font-semibold text-slate-700">{formatElapsed(ticket.createdAt, now)}</span>
          </p>
        </div>
      </div>

      {ticket.notes && (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">{ticket.notes}</p>
      )}

      <ul className="mt-3 space-y-1.5">
        {ticket.items.map((item) => (
          <li key={item.id} className="flex items-baseline gap-2 text-sm">
            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-slate-900 px-1.5 font-bold text-slate-50">
              {item.quantity}
            </span>
            <span className="font-medium text-slate-800">{item.name}</span>
            {item.variant && <span className="text-xs text-slate-500">{item.variant}</span>}
            {item.notes && <span className="text-xs italic text-slate-400">“{item.notes}”</span>}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
        {canOperate &&
          KITCHEN_NEXT[ticket.status].map((next) => (
            <button
              key={next}
              type="button"
              disabled={advancing}
              className={next === 'CANCELLED' ? 'btn-danger px-3 py-1.5 text-xs' : 'btn-primary px-3 py-1.5 text-xs'}
              onClick={() => onAdvance(ticket.id, next)}
            >
              {KITCHEN_STATUS_LABELS[next]}
            </button>
          ))}
        {KITCHEN_NEXT[ticket.status].length === 0 && (
          <p className="text-xs text-slate-400">
            {ticket.status === 'SERVED' ? 'Awaiting payment & completion.' : `Ticket ${KITCHEN_STATUS_LABELS[ticket.status].toLowerCase()}.`}
          </p>
        )}
      </div>
    </Card>
  );
}

export function KdsPage() {
  const toast = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canOperate = currentUser
    ? KITCHEN_OPERATOR_ROLES.includes(currentUser.role as (typeof KITCHEN_OPERATOR_ROLES)[number])
    : false;
  const { state: socketState, latencyMs } = useRealtimeStatus();

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const {
    data,
    isFetching,
    isError,
    error,
    refetch,
  } = useListKitchenOrdersQuery({ page: 1, limit: BOARD_PAGE_SIZE }, { pollingInterval: POLL_FALLBACK_MS });

  const [advance, { isLoading: advancing }] = useUpdateKitchenOrderStatusMutation();

  const { byColumn, muted } = useMemo(() => {
    const grouped: Record<string, KitchenOrderProfile[]> = {};
    for (const column of COLUMNS) grouped[column.key] = [];
    const history: KitchenOrderProfile[] = [];
    for (const ticket of data?.items ?? []) {
      const target = COLUMNS.find((c) => c.statuses.includes(ticket.status));
      if (target) {
        grouped[target.key].push(ticket);
      } else if (MUTED_STATUSES.includes(ticket.status)) {
        history.push(ticket);
      }
    }
    for (const key of Object.keys(grouped)) {
      grouped[key].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    history.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return { byColumn: grouped, muted: history };
  }, [data]);

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

  const socketPill = {
    connected: 'bg-emerald-500',
    connecting: 'bg-amber-500',
    disconnected: 'bg-red-500',
  }[socketState];

  return (
    <div className="min-h-full">
      <PageHeader
        title="Kitchen Display"
        description="Real-time production board — updates arrive over Socket.IO as tickets change."
        actions={
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm">
              <span className={`h-2 w-2 rounded-full ${socketPill}`} />
              {socketState === 'connected' ? `Live · ${latencyMs ?? 0}ms` : 'Reconnecting…'}
            </span>
            <button type="button" className="btn-secondary" onClick={() => refetch()} title="Refresh">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <Link to="/kitchen" className="btn-secondary">
              Ticket list
            </Link>
          </>
        }
      />

      {isFetching && !data ? (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <Card key={column.key}>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-32" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <EmptyState
          icon={<MonitorPlay className="h-8 w-8" />}
          title="Could not load the kitchen board"
          description={extractApiError(error).message}
          action={
            <button type="button" className="btn-secondary" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
              Try again
            </button>
          }
        />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          icon={<MonitorPlay className="h-8 w-8" />}
          title="The kitchen is quiet"
          description="Confirmed orders appear here in real time."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {COLUMNS.map((column) => (
            <section key={column.key}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{column.label}</h2>
                <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-slate-600 shadow-sm">
                  {byColumn[column.key].length}
                </span>
              </div>
              <div className="space-y-3">
                {byColumn[column.key].map((ticket) => (
                  <TicketTile
                    key={ticket.id}
                    ticket={ticket}
                    now={now}
                    canOperate={canOperate}
                    advancing={advancing}
                    onAdvance={handleAdvance}
                  />
                ))}
                {byColumn[column.key].length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-400">
                    Nothing here
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}

      {muted.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-400">
            Recent closed ({muted.length})
          </h2>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {muted.slice(0, 8).map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-500"
              >
                <span className="truncate font-medium">
                  {ticket.orderNumber} · ticket #{ticket.ticketNumber}
                </span>
                <Badge variant={ticket.status === 'CANCELLED' ? 'red' : 'slate'}>
                  {KITCHEN_STATUS_LABELS[ticket.status]}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}