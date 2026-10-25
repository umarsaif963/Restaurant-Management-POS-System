import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/auth/AuthShell';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useGetMeQuery } from '@/store/api/authApi';
import { useRegisterRestaurantMutation } from '@/store/api/publicApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must include a letter')
  .regex(/[0-9]/, 'Password must include a number');

const registerSchema = z
  .object({
    restaurantName: z.string().trim().min(2, 'Enter the name of your restaurant').max(120),
    ownerName: z.string().trim().min(2, 'Enter your name').max(100),
    email: z.string().trim().toLowerCase().email('Enter a valid email address'),
    phone: z.string().trim().max(30).optional(),
    address: z.string().trim().max(240).optional(),
    currency: z.string().trim().length(3, 'Use a three-letter currency code').optional(),
    password: passwordSchema,
    confirmPassword: z.string().trim(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: currentUser, isLoading: meLoading, isUninitialized } = useGetMeQuery();
  const [registerRestaurant, { isLoading }] = useRegisterRestaurantMutation();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { currency: 'USD' },
  });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    try {
      await registerRestaurant({
        restaurantName: values.restaurantName,
        ownerName: values.ownerName,
        email: values.email,
        phone: values.phone || null,
        password: values.password,
        confirmPassword: values.confirmPassword,
        address: values.address || null,
        currency: values.currency || undefined,
      }).unwrap();
      toast.success('Welcome aboard', 'Your restaurant workspace is ready.');
      navigate('/app', { replace: true });
    } catch (error) {
      const { message } = extractApiError(error);
      setFormError(message);
      toast.error('Could not create the workspace', message);
    }
  }

  if (currentUser && !meLoading && !isUninitialized) {
    return <Navigate to="/app" replace />;
  }

  return (
    <AuthShell>
      <h1 className="text-lg font-semibold text-slate-900">Create your restaurant</h1>
      <p className="mt-1 text-sm text-slate-500">
        You get a complete workspace with menu, orders, kitchen, inventory and staff management.
      </p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <FormField
          label="Restaurant name"
          htmlFor="restaurantName"
          error={errors.restaurantName?.message}
          required
        >
          <input
            id="restaurantName"
            className="input"
            autoComplete="organization"
            placeholder="Bella Vista"
            {...register('restaurantName')}
          />
        </FormField>
        <FormField label="Your name" htmlFor="ownerName" error={errors.ownerName?.message} required>
          <input
            id="ownerName"
            className="input"
            autoComplete="name"
            placeholder="Alex Morgan"
            {...register('ownerName')}
          />
        </FormField>
        <FormField label="Email address" htmlFor="email" error={errors.email?.message} required>
          <input
            id="email"
            type="email"
            className="input"
            autoComplete="email"
            placeholder="you@restaurant.com"
            {...register('email')}
          />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Phone" htmlFor="phone" error={errors.phone?.message}>
            <input id="phone" className="input" autoComplete="tel" {...register('phone')} />
          </FormField>
          <FormField
            label="Currency"
            htmlFor="currency"
            error={errors.currency?.message}
            hint="Three-letter code, e.g. USD or EUR."
          >
            <input id="currency" className="input" autoComplete="off" {...register('currency')} />
          </FormField>
        </div>
        <FormField label="Address" htmlFor="address" error={errors.address?.message}>
          <input
            id="address"
            className="input"
            autoComplete="street-address"
            placeholder="12 Market Street"
            {...register('address')}
          />
        </FormField>
        <FormField
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="At least 8 characters with a letter and a number."
          required
        >
          <input
            id="password"
            type="password"
            className="input"
            autoComplete="new-password"
            {...register('password')}
          />
        </FormField>
        <FormField
          label="Repeat password"
          htmlFor="confirmPassword"
          error={errors.confirmPassword?.message}
          required
        >
          <input
            id="confirmPassword"
            type="password"
            className="input"
            autoComplete="new-password"
            {...register('confirmPassword')}
          />
        </FormField>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <button type="submit" className="btn-primary w-full" disabled={isLoading}>
          {isLoading ? <Spinner className="h-4 w-4" /> : 'Create my workspace'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
