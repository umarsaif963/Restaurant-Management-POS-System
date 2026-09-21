import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useGetMeQuery, useLoginMutation } from '@/store/api/authApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginLocationState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { data: currentUser } = useGetMeQuery();
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const state = location.state as LoginLocationState | null;
  const from = state?.from?.pathname ?? '/';

  async function onSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      await login(values).unwrap();
      navigate(from, { replace: true });
    } catch (error) {
      const { message } = extractApiError(error);
      setFormError(message);
      toast.error('Login failed', message);
    }
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return (
    <AuthShell>
      <h1 className="text-lg font-semibold text-slate-900">Sign in</h1>
      <p className="mt-1 text-sm text-slate-500">Use your staff account to continue.</p>
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
        <FormField label="Password" htmlFor="password" error={errors.password?.message}>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="input"
            placeholder="••••••••"
            {...register('password')}
          />
        </FormField>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? <Spinner className="h-4 w-4" /> : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        Forgot your password?{' '}
        <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
          Reset it
        </Link>
      </p>
    </AuthShell>
  );
}