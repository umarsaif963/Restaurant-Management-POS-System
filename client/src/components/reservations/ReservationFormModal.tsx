import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CustomerProfile, ReservationProfile, RestaurantTableProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateReservationMutation, useUpdateReservationMutation } from '@/store/api/reservationApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';

const reservationFormSchema = z.object({
  customerName: z.string().trim().min(1, 'Customer name is required').max(100, 'Name must be at most 100 characters'),
  phone: z.string().trim().max(30, 'Phone must be at most 30 characters'),
  customerId: z.string(),
  tableId: z.string(),
  guests: z.coerce.number().int('Party size must be a whole number').min(1, 'Party size must be at least 1').max(50, 'Party size must be at most 50'),
  date: z.string().min(1, 'Pick a date and time'),
  notes: z.string().trim().max(1000, 'Notes must be at most 1000 characters'),
});

type ReservationFormValues = z.infer<typeof reservationFormSchema>;

interface ReservationFormModalProps {
  open: boolean;
  reservation: ReservationProfile | null;
  customers: CustomerProfile[];
  tables: RestaurantTableProfile[];
  onClose: () => void;
}

function toInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultDateInput(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() < 30 ? 30 : 0, 0, 0);
  if (d.getMinutes() === 0) d.setHours(d.getHours() + 1);
  return toInputValue(d.toISOString());
}

export function ReservationFormModal({ open, reservation, customers, tables, onClose }: ReservationFormModalProps) {
  const toast = useToast();
  const isEdit = reservation !== null;

  const [createReservation, { isLoading: creating }] = useCreateReservationMutation();
  const [updateReservation, { isLoading: updating }] = useUpdateReservationMutation();
  const busy = creating || updating;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      customerName: '',
      phone: '',
      customerId: '',
      tableId: '',
      guests: 2,
      date: '',
      notes: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        reservation
          ? {
              customerName: reservation.customerName,
              phone: reservation.phone ?? '',
              customerId: reservation.customerId ?? '',
              tableId: reservation.tableId ?? '',
              guests: reservation.guests,
              date: toInputValue(reservation.date),
              notes: reservation.notes ?? '',
            }
          : {
              customerName: '',
              phone: '',
              customerId: '',
              tableId: '',
              guests: 2,
              date: defaultDateInput(),
              notes: '',
            },
      );
    }
  }, [open, reservation, reset]);

  const selectedCustomerId = watch('customerId');
  const selectedTableId = watch('tableId');

  useEffect(() => {
    if (!selectedCustomerId) return;
    const customer = customers.find((c) => c.id === selectedCustomerId);
    if (customer) {
      setValue('customerName', customer.name);
      setValue('phone', customer.phone ?? '');
    }
  }, [selectedCustomerId, customers, setValue]);

  const tableOptions = useMemo(
    () => tables.filter((t) => t.status !== 'OCCUPIED' && t.status !== 'CLEANING'),
    [tables],
  );

  const selectedTable = tables.find((t) => t.id === selectedTableId);
  const guestsValue = Number(watch('guests')) || 0;
  const guestsTooBig = Boolean(selectedTable && guestsValue > selectedTable.capacity);

  async function onSubmit(values: ReservationFormValues) {
    const date = new Date(values.date).toISOString();
    const payload = {
      customerName: values.customerName.trim(),
      phone: values.phone.trim() === '' ? null : values.phone.trim(),
      customerId: values.customerId === '' ? null : values.customerId,
      tableId: values.tableId === '' ? null : values.tableId,
      guests: values.guests,
      date,
      notes: values.notes.trim() === '' ? null : values.notes.trim(),
    };
    try {
      if (isEdit) {
        await updateReservation({ id: reservation.id, data: payload }).unwrap();
        toast.success('Reservation updated', `${reservation.customerName}'s booking was saved.`);
      } else {
        const created = await createReservation(payload).unwrap();
        toast.success('Reservation created', `${created.customerName} — ${created.guests} guest${created.guests === 1 ? '' : 's'}.`);
      }
      onClose();
    } catch (error) {
      toast.error(isEdit ? 'Could not update reservation' : 'Could not create reservation', extractApiError(error).message);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Edit reservation' : 'New reservation'}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="reservation-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Create reservation'}
          </button>
        </>
      }
    >
      <form id="reservation-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Customer" htmlFor="res-customer" error={errors.customerId?.message} hint="Optional — link an existing profile">
            <select id="res-customer" className="input" {...register('customerId')}>
              <option value="">Walk-in / new guest</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                  {customer.phone ? ` — ${customer.phone}` : ''}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Table" htmlFor="res-table" error={errors.tableId?.message} hint="Optional — occupied tables are not bookable">
            <select id="res-table" className="input" {...register('tableId')}>
              <option value="">No table (assign later)</option>
              {tableOptions.map((table) => (
                <option key={table.id} value={table.id}>
                  Table {table.tableNumber}
                  {table.name ? ` — ${table.name}` : ''} ({table.capacity} seats, {table.status.toLowerCase()})
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Guest name" htmlFor="res-name" error={errors.customerName?.message} required>
            <input id="res-name" className="input" placeholder="Full name" {...register('customerName')} />
          </FormField>
          <FormField label="Phone" htmlFor="res-phone" error={errors.phone?.message} hint="Optional">
            <input id="res-phone" className="input" placeholder="+1 555 000 0000" {...register('phone')} />
          </FormField>
          <FormField label="Party size" htmlFor="res-guests" error={errors.guests?.message} required>
            <input id="res-guests" className="input" inputMode="numeric" {...register('guests')} />
          </FormField>
          <FormField label="Date & time" htmlFor="res-date" error={errors.date?.message} required>
            <input id="res-date" type="datetime-local" className="input" {...register('date')} />
          </FormField>
        </div>

        <FormField label="Notes" htmlFor="res-notes" error={errors.notes?.message} hint="Optional">
          <input id="res-notes" className="input" placeholder="Occasion, seating preference…" {...register('notes')} />
        </FormField>

        {guestsTooBig && (
          <p className="text-xs text-amber-600">
            Party of {guestsValue} exceeds table {selectedTable?.tableNumber}'s capacity ({selectedTable?.capacity}).
          </p>
        )}
        <p className="text-xs text-slate-500">
          Each booking holds a two-hour window. Conflicting bookings on the same table are rejected.
        </p>
      </form>
    </Modal>
  );
}