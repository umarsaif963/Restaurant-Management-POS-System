import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useChangePasswordMutation, useGetMeQuery } from '@/store/api/authApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { formatDateTime } from '@/utils/format';
import { ROLE_BADGE, ROLE_LABELS, STATUS_BADGE, STATUS_LABELS } from '@/constants/user';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/[0-9]/, 'Password must include a number');

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <span className="text-sm text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">{value}</span>
    </div>
  );
}

export function ProfilePage() {
  const toast = useToast();
  const { data: user } = useGetMeQuery();
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: ChangePasswordFormValues) {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      }).unwrap();
      toast.success('Password changed', 'Your account is still signed in on this device.');
      reset();
    } catch (error) {
      toast.error('Could not change password', extractApiError(error).message);
    }
  }

  return (
    <div>
      <PageHeader title="My Profile" description="Your account details and sign-in security." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Profile">
          {user ? (
            <div className="divide-y divide-slate-100">
              <DetailRow label="Name" value={user.name} />
              <DetailRow label="Email" value={user.email} />
              <DetailRow label="Phone" value={user.phone ?? '—'} />
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-sm text-slate-500">Role</span>
                <Badge variant={ROLE_BADGE[user.role]}>{ROLE_LABELS[user.role]}</Badge>
              </div>
              <div className="flex items-center justify-between gap-4 py-2">
                <span className="text-sm text-slate-500">Status</span>
                <Badge variant={STATUS_BADGE[user.status]}>{STATUS_LABELS[user.status]}</Badge>
              </div>
              <DetailRow
                label="Last login"
                value={user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
              />
            </div>
          ) : (
            <div className="flex justify-center py-6">
              <Spinner className="h-5 w-5 text-slate-400" />
            </div>
          )}
        </Card>

        <Card title="Change password">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField label="Current password" htmlFor="currentPassword" error={errors.currentPassword?.message}>
              <input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                className="input"
                {...register('currentPassword')}
              />
            </FormField>
            <FormField
              label="New password"
              htmlFor="newPassword"
              error={errors.newPassword?.message}
              hint="At least 8 characters, one letter and one number."
            >
              <input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                className="input"
                {...register('newPassword')}
              />
            </FormField>
            <FormField label="Confirm new password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="input"
                {...register('confirmPassword')}
              />
            </FormField>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading && <Spinner className="h-4 w-4" />}
              Update password
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}