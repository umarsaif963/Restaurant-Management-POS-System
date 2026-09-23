import { useState } from 'react';
import { Armchair, Ban, CalendarCheck2, CheckCircle2, Phone, Table2, UserRound } from 'lucide-react';
import type { ChangeReservationStatusInput, ReservationProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useChangeReservationStatusMutation } from '@/store/api/reservationApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { RESERVATION_STATUS_BADGE, RESERVATION_STATUS_LABELS } from '@/constants/reservations';

type Action = 'CONFIRM' | 'SEAT' | 'COMPLETE' | 'CANCEL';

const ACTION_STATUS: Record<Action, ChangeReservationStatusInput['status']> = {
  CONFIRM: 'CONFIRMED',
  SEAT: 'SEATED',
  COMPLETE: 'COMPLETED',
  CANCEL: 'CANCELLED',
};

const ACTION_BY_STATUS: Partial<Record<ReservationProfile['status'], Action[]>> = {
  PENDING: ['CONFIRM', 'SEAT', 'CANCEL'],
  CONFIRMED: ['SEAT', 'CANCEL'],
  SEATED: ['COMPLETE', 'CANCEL'],
};

interface ReservationDetailModalProps {
  open: boolean;
  reservation: ReservationProfile | null;
  onClose: () => void;
}

export function ReservationDetailModal({ open, reservation, onClose }: ReservationDetailModalProps) {
  const toast = useToast();
  const [confirmAction, setConfirmAction] = useState<Action | null>(null);
  const [changeStatus, { isLoading }] = useChangeReservationStatusMutation();

  if (!reservation) return null;
  const current = reservation;
  const actions = ACTION_BY_STATUS[current.status] ?? [];

  async function runConfirmedAction(action: Action) {
    try {
      const updated = await changeStatus({ id: current.id, data: { status: ACTION_STATUS[action] } }).unwrap();
      const label = RESERVATION_STATUS_LABELS[updated.status];
      toast.success(`Reservation ${label.toLowerCase()}`, `${current.customerName}'s booking is now ${label.toLowerCase()}.`);
      setConfirmAction(null);
      onClose();
    } catch (error) {
      toast.error('Could not change reservation status', extractApiError(error).message);
    }
  }

  const tableLine = current.tableNumber ? `Table ${current.tableNumber}` : 'No table assigned';
  const confirmMessage: Record<Action, string> = {
    CONFIRM: `Confirm the booking for ${current.customerName} (${current.guests} guest${current.guests === 1 ? '' : 's'})?`,
    SEAT: current.tableNumber
      ? `Seat ${current.guests} guest${current.guests === 1 ? '' : 's'} at Table ${current.tableNumber}? The table is marked occupied.`
      : 'This booking has no table yet. Assign a table before seating.',
    COMPLETE: `Mark ${current.customerName}'s visit as completed?`,
    CANCEL: `Cancel this booking?${current.tableNumber ? ' The table is released if it is still reserved.' : ''}`,
  };

  return (
    <Modal open={open} title={`Reservation — ${current.customerName}`} onClose={onClose} maxWidthClass="max-w-xl">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400">Status</span>
            <p>
              <Badge variant={RESERVATION_STATUS_BADGE[current.status]}>
                {RESERVATION_STATUS_LABELS[current.status]}
              </Badge>
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400">Date & time</span>
            <p className="font-medium text-slate-800">{new Date(current.date).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400">Party</span>
            <p className="font-medium text-slate-800">{current.guests} guest{current.guests === 1 ? '' : 's'}</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <UserRound className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">
              <span className="font-medium text-slate-800">{current.customerName}</span>
              {current.customerEmail ? ` — ${current.customerEmail}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <Armchair className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">
              {tableLine}
              {current.capacity ? ` (up to ${current.capacity} seats)` : ''}
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <Phone className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">{current.phone ?? 'No phone given'}</span>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm">
            <Table2 className="h-4 w-4 text-slate-400" />
            <span className="text-slate-600">Created by {current.createdByName ?? '—'}</span>
          </div>
        </div>

        {current.notes && (
          <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{current.notes}</p>
        )}

        <p className="text-xs text-slate-500">
          {current.status === 'PENDING' && 'Awaiting confirmation.'}
          {current.status === 'CONFIRMED' && 'Confirmed — the table is held for this booking window.'}
          {current.status === 'SEATED' && 'Guests are seated and the table is occupied.'}
          {current.status === 'COMPLETED' && 'Visit finished.'}
          {current.status === 'CANCELLED' && 'This booking was cancelled.'}
        </p>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button type="button" className="btn-secondary" onClick={onClose}>
          Close
        </button>
        {actions.includes('CONFIRM') && (
          <button type="button" className="btn-primary" onClick={() => setConfirmAction('CONFIRM')}>
            <CalendarCheck2 className="h-4 w-4" />
            Confirm
          </button>
        )}
        {actions.includes('SEAT') && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => setConfirmAction('SEAT')}
            disabled={!current.tableId}
          >
            <Armchair className="h-4 w-4" />
            Seat guests
          </button>
        )}
        {actions.includes('COMPLETE') && (
          <button type="button" className="btn-primary" onClick={() => setConfirmAction('COMPLETE')}>
            <CheckCircle2 className="h-4 w-4" />
            Complete
          </button>
        )}
        {actions.includes('CANCEL') && (
          <button type="button" className="btn-secondary" onClick={() => setConfirmAction('CANCEL')}>
            <Ban className="h-4 w-4" />
            Cancel booking
          </button>
        )}
        {actions.includes('SEAT') && !current.tableId && (
          <span className="self-center text-xs text-amber-600">Assign a table before seating.</span>
        )}
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === 'CANCEL' ? 'Cancel booking' : confirmAction === 'SEAT' ? 'Seat guests' : confirmAction === 'CONFIRM' ? 'Confirm booking' : 'Complete visit'}
        message={confirmAction ? confirmMessage[confirmAction] : ''}
        confirmLabel={confirmAction === 'CANCEL' ? 'Cancel booking' : confirmAction === 'SEAT' ? 'Seat guests' : confirmAction === 'CONFIRM' ? 'Confirm' : 'Complete'}
        busy={isLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => confirmAction && runConfirmedAction(confirmAction)}
      />
    </Modal>
  );
}