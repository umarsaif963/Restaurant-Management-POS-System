import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SupplierProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateSupplierMutation, useUpdateSupplierMutation } from '@/store/api/supplierApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';

const supplierFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  company: z.string().trim().max(120, 'Company must be at most 120 characters'),
  phone: z.string().trim().max(30, 'Phone must be at most 30 characters'),
  email: z
    .string()
    .trim()
    .max(255, 'Email is too long')
    .refine((value) => value === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), 'Enter a valid email'),
  address: z.string().trim().max(200, 'Address must be at most 200 characters'),
  notes: z.string().trim().max(400, 'Notes must be at most 400 characters'),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

interface SupplierFormModalProps {
  open: boolean;
  supplier: SupplierProfile | null;
  onClose: () => void;
}

export function SupplierFormModal({ open, supplier, onClose }: SupplierFormModalProps) {
  const toast = useToast();
  const isEdit = supplier !== null;

  const [createSupplier, { isLoading: creating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: updating }] = useUpdateSupplierMutation();
  const busy = creating || updating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: { name: '', company: '', phone: '', email: '', address: '', notes: '' },
  });

  useEffect(() => {
    if (open) {
      reset(
        supplier
          ? {
              name: supplier.name,
              company: supplier.company ?? '',
              phone: supplier.phone ?? '',
              email: supplier.email ?? '',
              address: supplier.address ?? '',
              notes: supplier.notes ?? '',
            }
          : { name: '', company: '', phone: '', email: '', address: '', notes: '' },
      );
    }
  }, [open, supplier, reset]);

  async function onSubmit(values: SupplierFormValues) {
    const payload = {
      name: values.name.trim(),
      company: values.company === '' ? null : values.company,
      phone: values.phone === '' ? null : values.phone,
      email: values.email === '' ? null : values.email,
      address: values.address === '' ? null : values.address,
      notes: values.notes === '' ? null : values.notes,
    };
    try {
      if (isEdit) {
        await updateSupplier({ id: supplier.id, data: payload }).unwrap();
        toast.success('Supplier updated', `${values.name} was saved.`);
      } else {
        const created = await createSupplier(payload).unwrap();
        toast.success('Supplier created', `${created.name} added to your vendors.`);
      }
      onClose();
    } catch (error) {
      toast.error(isEdit ? 'Could not update supplier' : 'Could not create supplier', extractApiError(error).message);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit: ${supplier.name}` : 'Add supplier'}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="supplier-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Add supplier'}
          </button>
        </>
      }
    >
      <form id="supplier-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor="sup-name" error={errors.name?.message} required>
            <input id="sup-name" className="input" placeholder="e.g. Fresh Farm Produce" {...register('name')} />
          </FormField>
          <FormField label="Company" htmlFor="sup-company" error={errors.company?.message} hint="Optional">
            <input id="sup-company" className="input" placeholder="Fresh Farm Ltd." {...register('company')} />
          </FormField>
          <FormField label="Phone" htmlFor="sup-phone" error={errors.phone?.message}>
            <input id="sup-phone" className="input" placeholder="+1 555 010 8800" {...register('phone')} />
          </FormField>
          <FormField label="Email" htmlFor="sup-email" error={errors.email?.message}>
            <input id="sup-email" type="email" className="input" placeholder="orders@vendor.example" {...register('email')} />
          </FormField>
          <FormField label="Address" htmlFor="sup-address" error={errors.address?.message}>
            <input id="sup-address" className="input" placeholder="88 Farm Road, Rural" {...register('address')} />
          </FormField>
          <FormField label="Notes" htmlFor="sup-notes" error={errors.notes?.message}>
            <input id="sup-notes" className="input" placeholder="Payment terms, delivery notes…" {...register('notes')} />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}