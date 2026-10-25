import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Permission, RoleProfile } from '@restaurant/shared';
import { PERMISSIONS, PERMISSION_LABELS, RESTAURANT_PERMISSIONS } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateRoleMutation, useUpdateRoleMutation } from '@/store/api/roleApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';

const roleSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(60, 'Name is too long'),
  description: z.string().trim().max(200, 'Description is too long').optional(),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface RoleFormModalProps {
  open: boolean;
  role: RoleProfile | null;
  onClose: () => void;
}

/**
 * A custom role carries an explicit permission list. It replaces the default
 * permissions of the job role it is attached to.
 */
export function RoleFormModal({ open, role, onClose }: RoleFormModalProps) {
  const toast = useToast();
  const [createRole, { isLoading: creating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: updating }] = useUpdateRoleMutation();
  const isEdit = role !== null;
  const busy = creating || updating;

  const [permissions, setPermissions] = useState<Permission[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: '', description: '' },
  });

  useEffect(() => {
    if (!open) return;
    setPermissions(role ? [...role.permissions] : []);
    reset(
      role
        ? { name: role.name, description: role.description ?? '' }
        : { name: '', description: '' },
    );
  }, [open, role, reset]);

  function toggle(permission: Permission) {
    setPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  }

  async function onSubmit(values: RoleFormValues) {
    try {
      if (isEdit && role) {
        await updateRole({
          id: role.id,
          data: {
            name: values.name,
            description: values.description ?? null,
            permissions,
          },
        }).unwrap();
        toast.success('Role updated', `${values.name} has been updated.`);
      } else {
        await createRole({
          name: values.name,
          description: values.description ?? null,
          permissions,
        }).unwrap();
        toast.success('Role created', `${values.name} is ready to assign.`);
      }
      onClose();
    } catch (error) {
      toast.error(
        isEdit ? 'Could not update role' : 'Could not create role',
        extractApiError(error).message,
      );
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit role: ${role.name}` : 'New role'}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="role-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Create role'}
          </button>
        </>
      }
    >
      <form id="role-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Role name" htmlFor="role-name" error={errors.name?.message} required>
          <input id="role-name" className="input" autoComplete="off" {...register('name')} />
        </FormField>
        <FormField
          label="Description"
          htmlFor="role-description"
          error={errors.description?.message}
          hint="What is this role good for?"
        >
          <input
            id="role-description"
            className="input"
            autoComplete="off"
            {...register('description')}
          />
        </FormField>

        <fieldset className="rounded-xl border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-700">Permissions</legend>
          <p className="mb-2 text-xs text-slate-500">
            {permissions.length} of {PERMISSIONS.length} selected. Platform capabilities are never
            assignable inside a restaurant.
          </p>
          <div className="grid max-h-56 gap-1 overflow-y-auto sm:grid-cols-2">
            {RESTAURANT_PERMISSIONS.map((permission) => (
              <label
                key={permission}
                className="flex items-center gap-2 rounded-md px-1 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border-slate-300"
                  checked={permissions.includes(permission)}
                  onChange={() => toggle(permission)}
                />
                {PERMISSION_LABELS[permission]}
              </label>
            ))}
          </div>
        </fieldset>
      </form>
    </Modal>
  );
}
