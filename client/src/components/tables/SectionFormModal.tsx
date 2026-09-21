import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { TableSectionProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateSectionMutation, useUpdateSectionMutation } from '@/store/api/tableApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';

const sectionFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name must be at most 60 characters'),
  position: z.coerce
    .number()
    .int('Position must be a whole number')
    .min(0, 'Position cannot be negative')
    .max(1000, 'Position is too large'),
});

interface SectionFormValues {
  name: string;
  position: number;
}

interface SectionFormModalProps {
  open: boolean;
  section: TableSectionProfile | null;
  onClose: () => void;
}

export function SectionFormModal({ open, section, onClose }: SectionFormModalProps) {
  const toast = useToast();
  const [createSection, { isLoading: creating }] = useCreateSectionMutation();
  const [updateSection, { isLoading: updating }] = useUpdateSectionMutation();
  const isEdit = section !== null;
  const busy = creating || updating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema),
    defaultValues: { name: '', position: 0 },
  });

  useEffect(() => {
    if (open) {
      reset(section ? { name: section.name, position: section.position } : { name: '', position: 0 });
    }
  }, [open, section, reset]);

  async function onSubmit(values: SectionFormValues) {
    try {
      if (isEdit) {
        await updateSection({ id: section.id, data: values }).unwrap();
        toast.success('Section updated', `${values.name} has been updated.`);
      } else {
        await createSection(values).unwrap();
        toast.success('Section created', `${values.name} added to the floor plan.`);
      }
      onClose();
    } catch (error) {
      toast.error(isEdit ? 'Could not update section' : 'Could not create section', extractApiError(error).message);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit section: ${section.name}` : 'Add section'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="section-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Add section'}
          </button>
        </>
      }
    >
      <form id="section-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Name" htmlFor="section-name" error={errors.name?.message} required>
          <input id="section-name" className="input" placeholder="e.g. Main Hall" {...register('name')} />
        </FormField>
        <FormField
          label="Display order"
          htmlFor="section-position"
          error={errors.position?.message}
          hint="Lower numbers appear first."
        >
          <input id="section-position" type="number" min={0} className="input" {...register('position')} />
        </FormField>
      </form>
    </Modal>
  );
}