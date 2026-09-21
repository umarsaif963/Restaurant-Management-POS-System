import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { MenuCategoryProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateCategoryMutation, useUpdateCategoryMutation } from '@/store/api/menuApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';

const categoryFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  description: z.string().trim().max(300, 'Description must be at most 300 characters'),
  position: z.string(),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface CategoryFormModalProps {
  open: boolean;
  category: MenuCategoryProfile | null;
  onClose: () => void;
}

export function CategoryFormModal({ open, category, onClose }: CategoryFormModalProps) {
  const toast = useToast();
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation();
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation();
  const isEdit = category !== null;
  const busy = creating || updating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: { name: '', description: '', position: '0' },
  });

  useEffect(() => {
    if (open) {
      reset(
        category
          ? {
              name: category.name,
              description: category.description ?? '',
              position: String(category.position),
            }
          : { name: '', description: '', position: '0' },
      );
    }
  }, [open, category, reset]);

  async function onSubmit(values: CategoryFormValues) {
    const payload = {
      name: values.name,
      description: values.description === '' ? null : values.description,
      position: Number(values.position) || 0,
    };
    try {
      if (isEdit) {
        await updateCategory({ id: category.id, data: payload }).unwrap();
        toast.success('Category updated', `${payload.name} was saved.`);
      } else {
        await createCategory(payload).unwrap();
        toast.success('Category created', `${payload.name} added to the menu.`);
      }
      onClose();
    } catch (error) {
      toast.error(isEdit ? 'Could not update category' : 'Could not create category', extractApiError(error).message);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit ${category.name}` : 'Add category'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="category-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Add category'}
          </button>
        </>
      }
    >
      <form id="category-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-[1fr_7rem] gap-4">
          <FormField label="Name" htmlFor="category-name" error={errors.name?.message} required>
            <input id="category-name" className="input" placeholder="e.g. Starters" {...register('name')} />
          </FormField>
          <FormField label="Position" htmlFor="category-position" error={errors.position?.message}>
            <input id="category-position" type="number" min={0} className="input" {...register('position')} />
          </FormField>
        </div>
        <FormField label="Description" htmlFor="category-description" error={errors.description?.message}>
          <textarea
            id="category-description"
            rows={3}
            className="input"
            placeholder="Optional"
            {...register('description')}
          />
        </FormField>
      </form>
    </Modal>
  );
}