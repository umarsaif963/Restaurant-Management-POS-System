import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { AuthUser, UserRole } from '@restaurant/shared';
import { USER_ROLES } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateUserMutation, useUpdateUserMutation } from '@/store/api/userApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { ROLE_LABELS } from '@/constants/user';

const baseUserFields = {
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  phone: z.string().trim().max(30, 'Phone is too long').optional(),
  role: z.enum(USER_ROLES),
};

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/[0-9]/, 'Password must include a number');

const createFormSchema = z.object({ ...baseUserFields, password: passwordSchema });
const editFormSchema = z.object({
  ...baseUserFields,
  password: z.string().trim().max(72).optional(),
});

interface UserFormValues {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password?: string;
}

interface UserFormModalProps {
  open: boolean;
  user: AuthUser | null;
  onClose: () => void;
}

export function UserFormModal({ open, user, onClose }: UserFormModalProps) {
  const toast = useToast();
  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const isEdit = user !== null;
  const busy = creating || updating;

  const { register, handleSubmit, reset, formState: { errors } } =
    useForm<UserFormValues>({
      resolver: zodResolver(isEdit ? editFormSchema : createFormSchema),
      defaultValues: { role: 'CASHIER' },
    });

  useEffect(() => {
    if (open) {
      reset(
        user
          ? { name: user.name, email: user.email, phone: user.phone ?? '', role: user.role, password: '' }
          : { name: '', email: '', phone: '', role: 'CASHIER', password: '' },
      );
    }
  }, [open, user, reset]);

  async function onSubmit(values: UserFormValues) {
    try {
      if (isEdit) {
        await updateUser({
          id: user.id,
          data: {
            name: values.name,
            email: values.email,
            phone: values.phone,
            role: values.role,
            ...(values.password ? { password: values.password } : {}),
          },
        }).unwrap();
        toast.success('User updated', `${values.name} has been updated.`);
      } else {
        await createUser({
          name: values.name,
          email: values.email,
          phone: values.phone,
          role: values.role,
          password: values.password!,
        }).unwrap();
        toast.success('User created', `${values.name} can now sign in.`);
      }
      onClose();
    } catch (error) {
      toast.error(isEdit ? 'Could not update user' : 'Could not create user', extractApiError(error).message);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit user: ${user.name}` : 'Add new user'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="user-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Create user'}
          </button>
        </>
      }
    >
      <form id="user-form" className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="Full name" htmlFor="user-name" error={errors.name?.message} required>
          <input id="user-name" className="input" autoComplete="off" {...register('name')} />
        </FormField>
        <FormField label="Email address" htmlFor="user-email" error={errors.email?.message} required>
          <input id="user-email" type="email" className="input" autoComplete="off" {...register('email')} />
        </FormField>
        <FormField label="Phone" htmlFor="user-phone" error={errors.phone?.message}>
          <input id="user-phone" className="input" autoComplete="off" placeholder="Optional" {...register('phone')} />
        </FormField>
        <FormField label="Role" htmlFor="user-role" error={errors.role?.message} required>
          <select id="user-role" className="input" {...register('role')}>
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </FormField>
        <FormField
          label={isEdit ? 'New password' : 'Initial password'}
          htmlFor="user-password"
          error={errors.password?.message}
          hint={isEdit ? 'Leave blank to keep the current password.' : '8+ characters, a letter and a number.'}
        >
          <input
            id="user-password"
            type="password"
            className="input"
            autoComplete="new-password"
            {...register('password')}
          />
        </FormField>
      </form>
    </Modal>
  );
}