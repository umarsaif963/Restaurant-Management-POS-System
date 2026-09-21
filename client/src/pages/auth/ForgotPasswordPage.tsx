import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useForgotPasswordMutation } from '@/store/api/authApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';

const forgotSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
});

type ForgotFormValues = z.infer<typeof forgotSchema>;

export function ForgotPasswordPage() {
  const toast = useToast();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({ resolver: zodResolver(forgotSchema) });

  async function onSubmit(values: ForgotFormValues) {
    try {
      await forgotPassword(values).unwrap();
      setSent(true);
      toast.success('Reset link sent', 'If an account exists for that email, mail is on the way.');
    } catch (error) {
      toast.error('Request failed', extractApiError(error).message);
    }
  }

  return (
    <AuthShell>
      {sent ? (
        <div className="text-center">
          <h1 className="text-lg font-semibold text-slate-900">Check your email</h1>
          <p className="mt-2 text-sm text-slate-500">
            If an account exists for that address, a password reset link has been sent. In
            development the link is printed to the server console instead of emailed.
          </p>
          <Link to="/login" className="btn-primary mt-5">
            Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <h1 className="text-lg font-semibold text-slate-900">Reset your password</h1>
          <p className="mt-1 text-sm text-slate-500">
            Enter your account email and we will send you a reset link.
          </p>
          <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
            <FormField label="Email address" htmlFor="email" error={errors.email?.message}>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className="input"
                placeholder="you@restaurant.com"
                {...register('email')}
              />
            </FormField>
            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? <Spinner className="h-4 w-4" /> : 'Send reset link'}
            </button>
          </form>
          <p className="mt-4 text-center text-sm text-slate-500">
            <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
              Back to sign in
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}