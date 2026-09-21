import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useResetPasswordMutation } from '@/store/api/authApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/[0-9]/, 'Password must include a number');

const resetSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type ResetFormValues = z.infer<typeof resetSchema>;

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema) });

  async function onSubmit(values: ResetFormValues) {
    setFormError(null);
    try {
      await resetPassword({ token, newPassword: values.newPassword }).unwrap();
      toast.success('Password reset', 'You can now sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (error) {
      const { message } = extractApiError(error);
      setFormError(message);
      toast.error('Reset failed', message);
    }
  }

  if (!token) {
    return (
      <AuthShell>
        <h1 className="text-lg font-semibold text-slate-900">Invalid reset link</h1>
        <p className="mt-2 text-sm text-slate-500">
          This link is missing its token. Request a new one from the login screen.
        </p>
        <Link to="/forgot-password" className="btn-primary mt-5">
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <h1 className="text-lg font-semibold text-slate-900">Choose a new password</h1>
      <p className="mt-1 text-sm text-slate-500">
        Your password must be at least 8 characters and include a letter and a number.
      </p>
      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField label="New password" htmlFor="newPassword" error={errors.newPassword?.message}>
          <input
            id="newPassword"
            type="password"
            autoComplete="new-password"
            className="input"
            {...register('newPassword')}
          />
        </FormField>
        <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            className="input"
            {...register('confirmPassword')}
          />
        </FormField>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? <Spinner className="h-4 w-4" /> : 'Set new password'}
        </button>
      </form>
    </AuthShell>
  );
}