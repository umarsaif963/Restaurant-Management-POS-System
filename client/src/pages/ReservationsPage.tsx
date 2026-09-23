import { useEffect, useState } from 'react';
import { CalendarDays, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type {
  ListReservationsQuery,
  ReservationProfile,
  ReservationStatus,
  UserRole,
} from '@restaurant/shared';
import { RESERVATION_STATUSES } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ReservationFormModal } from '@/components/reservations/ReservationFormModal';
import { ReservationDetailModal } from '@/components/reservations/ReservationDetailModal';
import { useDeleteReservationMutation, useListReservationsQuery } from '@/store/api/reservationApi';
import { useListCustomersQuery } from '@/store/api/customerApi';
import { useListTablesQuery } from '@/store/api/tableApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { RESERVATION_STATUS_BADGE, RESERVATION_STATUS_LABELS } from '@/constants/reservations';

const PAGE_SIZE = 20;
const FOH_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'];
const MANAGER_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER'];

function dayFromDate(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(`${value}T00:00:00`).toISOString();
}

function dayToDate(value: string): string | undefined {
  if (!value) return undefined;
  return new Date(`${value}T23:59:59.999`).toISOString();
}

export function ReservationsPage() {
  const toast = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canBook = currentUser ? FOH_ROLES.includes(currentUser.role) : false;
  const canDelete = currentUser ? MANAGER_ROLES.includes(currentUser.role) : false;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ReservationStatus | ''>('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ReservationProfile | null>(null);
  const [viewing, setViewing] = useState<ReservationProfile | null>(null);
  const [toDelete, setToDelete] = useState<ReservationProfile | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, fromDate, toDate]);

  const query: ListReservationsQuery = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: status || undefined,
    from: dayFromDate(fromDate),
    to: dayToDate(toDate),
  };

  const { data, isError, isFetching, refetch } = useListReservationsQuery(query);
  const { data: customers = { items: [], total: 0 } } = useListCustomersQuery({ limit: 100 });
  const { data: tables = [] } = useListTablesQuery();
  const [deleteReservation, { isLoading: deleting }] = useDeleteReservationMutation();

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deleteReservation(toDelete.id).unwrap();
      toast.success('Reservation deleted', `${toDelete.customerName}'s booking was removed.`);
      setToDelete(null);
    } catch (error) {
      toast.error('Could not delete reservation', extractApiErrorField(error));
    }
  }

  function openEdit(reservation: ReservationProfile) {
    if (reservation.status !== 'PENDING' && reservation.status !== 'CONFIRMED') return;
    setEditing(reservation);
    setFormOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Reservations"
        description="Upcoming bookings, table holds and guest seating."
        actions={
          canBook && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New reservation
            </button>
          )
        }
      />

      <section className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                className="input pl-9"
                placeholder="Search name or phone…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search reservations"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  className="input pl-9"
                  value={fromDate}
                  onChange={(event) => setFromDate(event.target.value)}
                  aria-label="From date"
                />
              </div>
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                className="input"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                aria-label="To date"
              />
              <select
                className="input w-auto"
                value={status}
                onChange={(event) => setStatus(event.target.value as ReservationStatus | '')}
                aria-label="Filter by status"
              >
                <option value="">All statuses</option>
                {RESERVATION_STATUSES.map((state) => (
                  <option key={state} value={state}>
                    {RESERVATION_STATUS_LABELS[state]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-slate-500">Could not load reservations.</p>
              <button type="button" className="btn-secondary" onClick={() => refetch()}>
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">When</th>
                    <th className="px-4 py-3 font-semibold">Guest</th>
                    <th className="px-4 py-3 font-semibold">Table</th>
                    <th className="px-4 py-3 font-semibold">Party</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isFetching && !data ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3" colSpan={6}>
                          <Skeleton className="h-5 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : data && data.items.length > 0 ? (
                    data.items.map((reservation) => {
                      const editable = reservation.status === 'PENDING' || reservation.status === 'CONFIRMED';
                      const deletable = reservation.status === 'PENDING' || reservation.status === 'CANCELLED';
                      return (
                        <tr key={reservation.id} className="transition hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{new Date(reservation.date).toLocaleString()}</p>
                            <p className="text-xs text-slate-400">
                              {new Date(reservation.date).toLocaleDateString(undefined, { weekday: 'short' })}
                            </p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{reservation.customerName}</p>
                            <p className="text-xs text-slate-400">{reservation.phone ?? ''}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {reservation.tableNumber ? `Table ${reservation.tableNumber}` : '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{reservation.guests}</td>
                          <td className="px-4 py-3">
                            <Badge variant={RESERVATION_STATUS_BADGE[reservation.status]}>
                              {RESERVATION_STATUS_LABELS[reservation.status]}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setViewing(reservation)}
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                title="View reservation"
                                aria-label={`View ${reservation.customerName}`}
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              {canBook && editable && (
                                <button
                                  type="button"
                                  onClick={() => openEdit(reservation)}
                                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                  title="Edit reservation"
                                  aria-label={`Edit ${reservation.customerName}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                              )}
                              {canDelete && deletable && (
                                <button
                                  type="button"
                                  onClick={() => setToDelete(reservation)}
                                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                  title="Delete reservation"
                                  aria-label={`Delete ${reservation.customerName}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          icon={<CalendarDays className="h-6 w-6" />}
                          title={debouncedSearch || status || fromDate || toDate ? 'No reservations found' : 'No reservations yet'}
                          description={
                            debouncedSearch || status || fromDate || toDate
                              ? 'Try adjusting your search or filters.'
                              : 'Create a booking to hold a table for upcoming guests.'
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total > 0 && (
            <div className="border-t border-slate-100 px-4 py-3">
              <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
            </div>
          )}
          {isFetching && data && (
            <div className="flex justify-center border-t border-slate-100 py-3">
              <Spinner className="h-4 w-4 text-slate-400" />
            </div>
          )}
        </Card>
      </section>

      <ReservationFormModal
        open={formOpen}
        reservation={editing}
        customers={customers.items}
        tables={tables}
        onClose={() => setFormOpen(false)}
      />
      <ReservationDetailModal open={viewing !== null} reservation={viewing} onClose={() => setViewing(null)} />

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete reservation"
        message={toDelete ? `Delete ${toDelete.customerName}'s booking? Only pending or cancelled reservations can be deleted.` : ''}
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function extractApiErrorField(error: unknown): string {
  const anyError = error as { data?: { message?: string } };
  return anyError.data?.message ?? 'Try again.';
}