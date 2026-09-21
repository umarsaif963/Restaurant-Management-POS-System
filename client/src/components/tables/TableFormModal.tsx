import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { RestaurantTableProfile, TableSectionProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateTableMutation, useUpdateTableMutation } from '@/store/api/tableApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';

const tableFormSchema = z.object({
  tableNumber: z.coerce
    .number()
    .int('Table number must be a whole number')
    .min(1, 'Table number must be at least 1')
    .max(9999, 'Table number is too large'),
  name: z.string().trim().max(60, 'Name must be at most 60 characters'),
  capacity: z.coerce
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(100, 'Capacity is too large'),
  sectionId: z.string(),
});

interface TableFormValues {
  tableNumber: number;
  name: string;
  capacity: number;
  sectionId: string;
}

interface TableFormModalProps {
  open: boolean;
  table: RestaurantTableProfile | null;
  sections: TableSectionProfile[];
  onClose: () => void;
}

export function TableFormModal({ open, table, sections, onClose }: TableFormModalProps) {
  const toast = useToast();
  const [createTable, { isLoading: creating }] = useCreateTableMutation();
  const [updateTable, { isLoading: updating }] = useUpdateTableMutation();
  const isEdit = table !== null;
  const busy = creating || updating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TableFormValues>({
    resolver: zodResolver(tableFormSchema),
    defaultValues: { tableNumber: 1, capacity: 2, name: '', sectionId: '' },
  });

  useEffect(() => {
    if (open) {
      reset(
        table
          ? {
            tableNumber: table.tableNumber,
            name: table.name ?? '',
            capacity: table.capacity,
            sectionId: table.sectionId ?? '',
          }
          : { tableNumber: 1, name: '', capacity: 2, sectionId: '' },
      );
    }
  }, [open, table, reset]);

  async function onSubmit(values: TableFormValues) {
    const payload = {
      tableNumber: values.tableNumber,
      name: values.name === '' ? null : values.name,
      capacity: values.capacity,
      sectionId: values.sectionId === '' ? null : values.sectionId,
    };
    try {
      if (isEdit) {
        await updateTable({ id: table.id, data: payload }).unwrap();
        toast.success('Table updated', `Table ${String(values.tableNumber).padStart(2, '0')} has been updated.`);
      } else {
        await createTable(payload).unwrap();
        toast.success('Table created', `Table ${String(values.tableNumber).padStart(2, '0')} added to the floor plan.`);
      }
      onClose();
    } catch (error) {
      toast.error(isEdit ? 'Could not update table' : 'Could not create table', extractApiError(error).message);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit table ${String(table.tableNumber).padStart(2, '0')}` : 'Add table'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="table-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Add table'}
          </button>
        </>
      }
    >
      <form id="table-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Table number" htmlFor="table-number" error={errors.tableNumber?.message} required>
            <input id="table-number" type="number" min={1} className="input" {...register('tableNumber')} />
          </FormField>
          <FormField label="Capacity (seats)" htmlFor="table-capacity" error={errors.capacity?.message} required>
            <input id="table-capacity" type="number" min={1} className="input" {...register('capacity')} />
          </FormField>
        </div>
        <FormField label="Display name" htmlFor="table-name" error={errors.name?.message} hint="Optional friendly label, e.g. “Window booth”.">
          <input id="table-name" className="input" placeholder="Optional" {...register('name')} />
        </FormField>
        <FormField label="Section" htmlFor="table-section" error={errors.sectionId?.message}>
          <select id="table-section" className="input" {...register('sectionId')}>
            <option value="">No section</option>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>
                {section.name}
              </option>
            ))}
          </select>
        </FormField>
      </form>
    </Modal>
  );
}