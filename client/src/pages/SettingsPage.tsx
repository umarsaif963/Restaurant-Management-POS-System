import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { SettingsView, UpdateSettingsInput } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/store/api/settingsApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';

const OPENING_DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
  { key: 'sunday', label: 'Sunday' },
] as const;

type DayKey = (typeof OPENING_DAYS)[number]['key'];

const hourFields = Object.fromEntries(
  OPENING_DAYS.map((day) => [day.key, z.string().trim().max(60)]),
) as Record<DayKey, z.ZodString>;

const formSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Enter a valid email address').or(z.literal('')),
  phone: z.string().trim().max(40, 'Phone is too long'),
  address: z.string().trim().max(300, 'Address is too long'),
  currency: z.string().trim().toUpperCase().length(3, 'Currency must be a 3-letter code'),
  taxPercentage: z.string().trim().regex(/^\d{1,3}(\.\d{1,2})?$/, 'Enter a valid percentage'),
  serviceChargePct: z.string().trim().regex(/^\d{1,3}(\.\d{1,2})?$/, 'Enter a valid percentage'),
  orderNumberPrefix: z.string().trim().min(1, 'Prefix is required').max(12, 'Prefix is too long'),
  receiptHeader: z.string().trim().max(1000, 'Receipt header is too long'),
  receiptFooter: z.string().trim().max(1000, 'Receipt footer is too long'),
  showTaxOnReceipt: z.boolean(),
  showServiceChargeOnReceipt: z.boolean(),
  ...hourFields,
});

type FormValues = z.infer<typeof formSchema>;

function toFormValues(view: SettingsView): FormValues {
  const hours = view.settings.openingHours ?? {};
  return {
    name: view.restaurant.name,
    email: view.restaurant.email ?? '',
    phone: view.restaurant.phone ?? '',
    address: view.restaurant.address ?? '',
    currency: view.restaurant.currency,
    taxPercentage: view.restaurant.taxPercentage,
    serviceChargePct: view.restaurant.serviceChargePct,
    orderNumberPrefix: view.settings.orderNumberPrefix,
    receiptHeader: view.settings.receiptHeader ?? '',
    receiptFooter: view.settings.receiptFooter ?? '',
    showTaxOnReceipt: view.settings.showTaxOnReceipt,
    showServiceChargeOnReceipt: view.settings.showServiceChargeOnReceipt,
    monday: hours.monday ?? '',
    tuesday: hours.tuesday ?? '',
    wednesday: hours.wednesday ?? '',
    thursday: hours.thursday ?? '',
    friday: hours.friday ?? '',
    saturday: hours.saturday ?? '',
    sunday: hours.sunday ?? '',
  };
}

function buildPayload(values: FormValues): UpdateSettingsInput {
  return {
    restaurant: {
      name: values.name,
      email: values.email === '' ? null : values.email,
      phone: values.phone === '' ? null : values.phone,
      address: values.address === '' ? null : values.address,
      currency: values.currency,
      taxPercentage: values.taxPercentage,
      serviceChargePct: values.serviceChargePct,
    },
    settings: {
      orderNumberPrefix: values.orderNumberPrefix,
      receiptHeader: values.receiptHeader === '' ? null : values.receiptHeader,
      receiptFooter: values.receiptFooter === '' ? null : values.receiptFooter,
      showTaxOnReceipt: values.showTaxOnReceipt,
      showServiceChargeOnReceipt: values.showServiceChargeOnReceipt,
      openingHours: Object.fromEntries(OPENING_DAYS.map((day) => [day.key, values[day.key]])),
    },
  };
}

export function SettingsPage() {
  const toast = useToast();
  const { data, isLoading, isError, refetch } = useGetSettingsQuery();
  const [updateSettings, { isLoading: saving }] = useUpdateSettingsMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  useEffect(() => {
    if (data) {
      reset(toFormValues(data));
    }
  }, [data, reset]);

  async function onSubmit(values: FormValues) {
    try {
      await updateSettings(buildPayload(values)).unwrap();
      toast.success('Settings saved', 'Restaurant settings have been updated.');
    } catch (error) {
      toast.error('Could not save settings', extractApiError(error).message);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6 text-slate-400" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <p className="text-sm text-slate-500">Could not load restaurant settings.</p>
        <button type="button" className="btn-secondary" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Restaurant Settings"
        description="Branding, pricing configuration and receipt preferences."
        actions={
          <button
            type="submit"
            form="settings-form"
            className="btn-primary"
            disabled={saving}
          >
            {saving && <Spinner className="h-4 w-4" />}
            Save settings
          </button>
        }
      />

      <form id="settings-form" className="grid gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <Card title="Restaurant information">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Restaurant name" htmlFor="s-name" error={errors.name?.message} required>
              <input id="s-name" className="input" {...register('name')} />
            </FormField>
            <FormField label="Email" htmlFor="s-email" error={errors.email?.message}>
              <input id="s-email" type="email" className="input" {...register('email')} />
            </FormField>
            <FormField label="Phone" htmlFor="s-phone" error={errors.phone?.message}>
              <input id="s-phone" className="input" {...register('phone')} />
            </FormField>
            <FormField label="Address" htmlFor="s-address" error={errors.address?.message}>
              <input id="s-address" className="input" {...register('address')} />
            </FormField>
            <FormField label="Currency (3-letter)" htmlFor="s-currency" error={errors.currency?.message} required>
              <input id="s-currency" className="input uppercase" maxLength={3} {...register('currency')} />
            </FormField>
            <FormField label="Tax percentage" htmlFor="s-tax" error={errors.taxPercentage?.message} required>
              <input id="s-tax" className="input" placeholder="e.g. 10" {...register('taxPercentage')} />
            </FormField>
            <FormField
              label="Service charge percentage"
              htmlFor="s-service"
              error={errors.serviceChargePct?.message}
              required
            >
              <input id="s-service" className="input" placeholder="e.g. 5" {...register('serviceChargePct')} />
            </FormField>
            <FormField label="Order number prefix" htmlFor="s-prefix" error={errors.orderNumberPrefix?.message} required>
              <input id="s-prefix" className="input" {...register('orderNumberPrefix')} />
            </FormField>
          </div>
        </Card>

        <Card title="Receipts">
          <div className="space-y-4">
            <FormField label="Receipt header" htmlFor="s-receipt-header" error={errors.receiptHeader?.message}>
              <textarea
                id="s-receipt-header"
                className="input"
                rows={2}
                placeholder="Printed at the top of receipts"
                {...register('receiptHeader')}
              />
            </FormField>
            <FormField label="Receipt footer" htmlFor="s-receipt-footer" error={errors.receiptFooter?.message}>
              <textarea
                id="s-receipt-footer"
                className="input"
                rows={2}
                placeholder="Printed at the bottom of receipts"
                {...register('receiptFooter')}
              />
            </FormField>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register('showTaxOnReceipt')} />
                Show tax on receipts
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  {...register('showServiceChargeOnReceipt')}
                />
                Show service charge on receipts
              </label>
            </div>
          </div>
        </Card>

        <Card title="Opening hours">
          <div className="grid gap-4 sm:grid-cols-2">
            {OPENING_DAYS.map((day) => (
              <FormField key={day.key} label={day.label} htmlFor={`s-${day.key}`}>
                <input
                  id={`s-${day.key}`}
                  className="input"
                  placeholder="e.g. 10:00 - 23:00"
                  {...register(day.key)}
                />
              </FormField>
            ))}
          </div>
        </Card>
      </form>
    </div>
  );
}