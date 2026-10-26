import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useGetMeQuery, useLoginMutation } from '@/store/api/authApi';
import { useToast } from '@/hooks/useToast';

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginLocationState {
  from?: { pathname?: string };
}

/**
 * Map a failed login attempt to an inline form message. Login failures never
 * toast — the rejection is the typed payload from `axiosBaseQuery`, where
 * `status: 0` means the request never reached the server (offline, connection
 * refused, DNS failure or timeout), so network, credential and server failures
 * are classified by HTTP status instead of falling through to a generic error.
 */
function loginErrorMessage(error: unknown): string {
  const payload = (typeof error === 'object' && error !== null ? error : {}) as {
    status?: number;
    message?: string;
  };
  if (!payload.status) {
    return 'Unable to connect to the server. Please check your internet connection and try again.';
  }
  if (payload.status === 401) {
    return 'Incorrect email or password.';
  }
  if (payload.status >= 500) {
    return 'Server error. Please try again later.';
  }
  // Other 4xx responses carry a meaningful message (e.g. a suspended
  // restaurant); surface it rather than a generic "Unexpected error".
  return payload.message?.trim() || 'Unable to sign in. Please try again.';
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { data: currentUser, isLoading: meLoading, isFetching: meFetching, isUninitialized: meUninitialized } = useGetMeQuery();
  const [login, { isLoading }] = useLoginMutation();
  const [formError, setFormError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const state = location.state as LoginLocationState | null;
  const from = state?.from?.pathname ?? '/app';

  async function onSubmit(values: LoginFormValues) {
    // Clear any inline error left over from a previous failed attempt.
    setFormError(null);
    try {
      await login(values).unwrap();
      // Success is the only login event that produces a toast; the Toaster
      // mounts with the app layout, so it appears right after navigation.
      setFormError(null);
      toast.success('Login successful', 'Welcome back.');
      navigate(from, { replace: true });
    } catch (error) {
      setFormError(loginErrorMessage(error));
    }
  }

  if (currentUser && !meLoading && !meUninitialized && !meFetching) {
    return <Navigate to={currentUser.role === 'SUPER_ADMIN' ? '/platform' : '/app'} replace />;
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