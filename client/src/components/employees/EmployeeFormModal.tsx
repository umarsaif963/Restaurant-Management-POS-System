import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { EmployeeProfile, Permission, UserRole } from '@restaurant/shared';
import {
  PERMISSIONS,
  PERMISSION_LABELS,
  RESTAURANT_PERMISSIONS,
  RESTAURANT_USER_ROLES,
} from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import {
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
} from '@/store/api/employeeApi';
import { useListRolesQuery } from '@/store/api/roleApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { ROLE_LABELS } from '@/constants/user';

const baseFields = {
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z.string().trim().max(30, 'Phone is too long').optional(),
  role: z.enum(RESTAURANT_USER_ROLES),
  customRoleId: z.string().optional(),
  extraPermissions: z.array(z.enum(PERMISSIONS)).optional(),
  restrictedPermissions: z.array(z.enum(PERMISSIONS)).optional(),
};

const createFormSchema = z.object({
  ...baseFields,
  password: z.string().trim().max(72).optional(),
});

const editFormSchema = z.object({
  ...baseFields,
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
});

type EmployeeFormValues = z.infer<typeof createFormSchema> & {
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
};

interface EmployeeFormModalProps {
  open: boolean;
  employee: EmployeeProfile | null;
  onClose: () => void;
}

/**
 * Create or edit a staff account. The role gives the default permission set,
 * a custom role replaces it, and the two checklists below add or remove single
 * capabilities on top.
 */
export function EmployeeFormModal({ open, employee, onClose }: EmployeeFormModalProps) {
  const toast = useToast();
  const [createEmployee, { isLoading: creating }] = useCreateEmployeeMutation();
  const [updateEmployee, { isLoading: updating }] = useUpdateEmployeeMutation();
  const { data: roles } = useListRolesQuery(undefined, { skip: !open });
  const isEdit = employee !== null;
  const busy = creating || updating;

  const [extraPermissions, setExtraPermissions] = useState<Permission[]>([]);
  const [restrictedPermissions, setRestrictedPermissions] = useState<Permission[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(isEdit ? editFormSchema : createFormSchema),
    defaultValues: {
      role: 'CASHIER',
      extraPermissions: [],
      restrictedPermissions: [],
    },
  });

  useEffect(() => {
    if (!open) return;
    // The employee's individual grants are part of the form state, so an edit
    // round-trips them instead of silently clearing them.
    setExtraPermissions(employee?.extraPermissions ?? []);
    setRestrictedPermissions(employee?.restrictedPermissions ?? []);
    reset(
      employee
        ? {
            name: employee.name,
            email: employee.email,
            phone: employee.phone ?? '',
            role: employee.role as (typeof RESTAURANT_USER_ROLES)[number],
            customRoleId: employee.customRoleId ?? '',
            extraPermissions: employee.extraPermissions ?? [],
            restrictedPermissions: employee.restrictedPermissions ?? [],
            status: employee.status,
          }
        : {
            name: '',
            email: '',
            phone: '',
            role: 'CASHIER',
            customRoleId: '',
            password: '',
            extraPermissions: [],
            restrictedPermissions: [],
          },
    );
  }, [open, employee, reset]);

  const selectedRole = watch('role') as UserRole;
  const selectedCustomRole = watch('customRoleId');

  function toggle(list: Permission[], permission: Permission): Permission[] {
    return list.includes(permission)
      ? list.filter((item) => item !== permission)
      : [...list, permission];
  }

  async function onSubmit(values: EmployeeFormValues) {
    try {
      if (isEdit && employee) {
        await updateEmployee({
          id: employee.id,
          data: {
            name: values.name,
            email: values.email,
            phone: values.phone ?? null,
            role: values.role as UserRole,
            customRoleId: values.customRoleId ? values.customRoleId : null,
            extraPermissions,
            restrictedPermissions,
            ...(values.status ? { status: values.status } : {}),
          },
        }).unwrap();
        toast.success('Employee updated', `${values.name} has been updated.`);
      } else {
        const result = await createEmployee({
          name: values.name,
          email: values.email,
          phone: values.phone ?? null,
          role: values.role as UserRole,
          customRoleId: values.customRoleId ? values.customRoleId : null,
          extraPermissions,
          restrictedPermissions,
          ...(values.password ? { password: values.password } : {}),
        }).unwrap();
        toast.success(
          'Employee created',
          result.temporaryPassword
            ? `Temporary password: ${result.temporaryPassword}`
            : `${values.name} can now sign in.`,
        );
      }
      onClose();
    } catch (error) {
      toast.error(
        isEdit ? 'Could not update employee' : 'Could not create employee',
        extractApiError(error).message,
      );
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit employee: ${employee.name}` : 'Add employee'}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="employee-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Create employee'}
          </button>
        </>
      }
    >
      <form id="employee-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Full name" htmlFor="employee-name" error={errors.name?.message} required>
          <input id="employee-name" className="input" autoComplete="off" {...register('name')} />
        </FormField>
        <FormField
          label="Email address"
          htmlFor="employee-email"
          error={errors.email?.message}
          required
        >
          <input
            id="employee-email"
            type="email"
            className="input"
            autoComplete="off"
            {...register('email')}
          />
        </FormField>
        <FormField label="Phone" htmlFor="employee-phone" error={errors.phone?.message}>
          <input
            id="employee-phone"
            className="input"
            autoComplete="off"
            placeholder="Optional"
            {...register('phone')}
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Role" htmlFor="employee-role" error={errors.role?.message} required>
            <select id="employee-role" className="input" {...register('role')}>
              {RESTAURANT_USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label="Custom role"
            htmlFor="employee-custom-role"
            error={errors.customRoleId?.message}
            hint="Replaces the default permissions of the role above."
          >
            <select id="employee-custom-role" className="input" {...register('customRoleId')}>
              <option value="">None</option>
              {(roles ?? [])
                .filter((role) => !role.isSystem)
                .map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
            </select>
          </FormField>
        </div>

        {isEdit && (
          <FormField
            label="Account status"
            htmlFor="employee-status"
            error={errors.status?.message}
            hint="Changing the status signs the employee out of every device."
          >
            <select id="employee-status" className="input" {...register('status')}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </FormField>
        )}

        {!isEdit && (
          <FormField
            label="Initial password"
            htmlFor="employee-password"
            error={errors.password?.message}
            hint="Leave empty and the system generates a secure temporary password for you to share."
          >
            <input
              id="employee-password"
              type="password"
              className="input"
              autoComplete="new-password"
              {...register('password')}
            />
          </FormField>
        )}

        <PermissionChecklist
          title="Extra permissions"
          description="Granted on top of the role."
          selected={extraPermissions}
          onToggle={(permission) => {
            const next = toggle(extraPermissions, permission);
            setExtraPermissions(next);
            setValue('extraPermissions', next);
          }}
        />
        <PermissionChecklist
          title="Restricted permissions"
          description="Removed from the role for this employee only."
          selected={restrictedPermissions}
          onToggle={(permission) => {
            const next = toggle(restrictedPermissions, permission);
            setRestrictedPermissions(next);
            setValue('restrictedPermissions', next);
          }}
        />

        <p className="text-xs text-slate-500">
          {selectedCustomRole
            ? 'Base role: the custom role above. The checklists still apply on top of it.'
            : `Base role: ${ROLE_LABELS[selectedRole]}.`}{' '}
          Platform capabilities are never assignable inside a restaurant.
        </p>
      </form>
    </Modal>
  );
}

interface PermissionChecklistProps {
  title: string;
  description: string;
  selected: Permission[];
  onToggle: (permission: Permission) => void;
}

function PermissionChecklist({ title, description, selected, onToggle }: PermissionChecklistProps) {
  return (
    <fieldset className="rounded-xl border border-slate-200 p-4">
      <legend className="px-1 text-sm font-medium text-slate-700">{title}</legend>
      <p className="mb-2 text-xs text-slate-500">{description}</p>
      <div className="grid max-h-48 gap-1 overflow-y-auto sm:grid-cols-2">
        {RESTAURANT_PERMISSIONS.map((permission) => (
          <label
            key={permission}
            className="flex items-center gap-2 rounded-md px-1 py-0.5 text-xs text-slate-600 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-300"
              checked={selected.includes(permission)}
              onChange={() => onToggle(permission)}
            />
            {PERMISSION_LABELS[permission]}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
