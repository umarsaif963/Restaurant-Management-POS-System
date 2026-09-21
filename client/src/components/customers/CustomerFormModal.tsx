import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CustomerProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateCustomerMutation, useUpdateCustomerMutation } from '@/store/api/customerApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';

const customerFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  phone: z.string().trim().max(30, 'Phone is too long'),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Enter a valid email address')
    .or(z.literal('')),
  address: z.string().trim().max(300, 'Address is too long'),
  notes: z.string().trim().max(1000, 'Notes are too long'),
});

interface CustomerFormValues {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface CustomerFormModalProps {
  open: boolean;
  customer: CustomerProfile | null;
  onClose: () => void;
}

export function CustomerFormModal({ open, customer, onClose }: CustomerFormModalProps) {
  const toast = useToast();
  const [createCustomer, { isLoading: creating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: updating }] = useUpdateCustomerMutation();
  const isEdit = customer !== null;
  const busy = creating || updating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: { name: '', phone: '', email: '', address: '', notes: '' },
  });

  useEffect(() => {
    if (open) {
      reset(
        customer
          ? {
            name: customer.name,
            phone: customer.phone ?? '',
            email: customer.email ?? '',
            address: customer.address ?? '',
            notes: customer.notes ?? '',
          }
          : { name: '', phone: '', email: '', address: '', notes: '' },
      );
    }
  }, [open, customer, reset]);

  async function onSubmit(values: CustomerFormValues) {
    const payload = {
      name: values.name,
      phone: values.phone === '' ? null : values.phone,
      email: values.email === '' ? null : values.email,
      address: values.address === '' ? null : values.address,
      notes: values.notes === '' ? null : values.notes,
    };
    try {
      if (isEdit) {
        await updateCustomer({ id: customer.id, data: payload }).unwrap();
        toast.success('Customer updated', `${values.name} has been updated.`);
      } else {
        await createCustomer(payload).unwrap();
        toast.success('Customer created', `${values.name} added to the directory.`);
      }
      onClose();
    } catch (error) {
      toast.error(isEdit ? 'Could not update customer' : 'Could not create customer', extractApiError(error).message);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit customer: ${customer.name}` : 'Add customer'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="customer-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Add customer'}
          </button>
        </>
      }
    >
      <form id="customer-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Full name" htmlFor="customer-name" error={errors.name?.message} required>
          <input id="customer-name" className="input" autoComplete="off" {...register('name')} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Phone" htmlFor="customer-phone" error={errors.phone?.message}>
            <input id="customer-phone" className="input" placeholder="Optional" {...register('phone')} />
          </FormField>
          <FormField label="Email" htmlFor="customer-email" error={errors.email?.message}>
            <input id="customer-email" type="email" className="input" placeholder="Optional" {...register('email')} />
          </FormField>
        </div>
        <FormField label="Address" htmlFor="customer-address" error={errors.address?.message}>
          <input id="customer-address" className="input" placeholder="Optional" {...register('address')} />
        </FormField>
        <FormField label="Notes" htmlFor="customer-notes" error={errors.notes?.message}>
          <textarea
            id="customer-notes"
            className="input"
            rows={2}
            placeholder="Preferences, allergies, etc."
            {...register('notes')}
          />
        </FormField>
      </form>
    </Modal>
  );
}