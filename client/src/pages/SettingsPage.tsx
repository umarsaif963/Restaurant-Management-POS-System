import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, UtensilsCrossed } from 'lucide-react';
import type { SettingsView, UpdateSettingsInput } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useGetSettingsQuery, useUpdateSettingsMutation } from '@/store/api/settingsApi';
import { apiSlice } from '@/store/api/apiSlice';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { removeRestaurantIcon, writeRestaurantIcon } from '@/utils/restaurantIcon';
import { useRestaurantIcon } from '@/hooks/useRestaurantIcon';
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

/**
 * Opening hours are keyed by 3-letter day codes (`mon`, `tue`, …): the
 * settings endpoint validates record keys at a maximum of 3 characters, while
 * rows written by older data use full day names. Writes therefore always use
 * the codes, and reads fall back from the full name to the code so both
 * formats display correctly.
 */
const DAY_CODES: Record<DayKey, string> = {
  monday: 'mon',
  tuesday: 'tue',
  wednesday: 'wed',
  thursday: 'thu',
  friday: 'fri',
  saturday: 'sat',
  sunday: 'sun',
};

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
  const dayValue = (day: DayKey): string => hours[day] ?? hours[DAY_CODES[day]] ?? '';
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
    monday: dayValue('monday'),
    tuesday: dayValue('tuesday'),
    wednesday: dayValue('wednesday'),
    thursday: dayValue('thursday'),
    friday: dayValue('friday'),
    saturday: dayValue('saturday'),
    sunday: dayValue('sunday'),
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
      // 3-letter day keys satisfy the endpoint's key validation; cleared days
      // are omitted entirely because the endpoint rejects empty strings.
      openingHours: Object.fromEntries(
        OPENING_DAYS.filter((day) => values[day.key].trim() !== '').map((day) => [
          DAY_CODES[day.key],
          values[day.key].trim(),
        ]),
      ),
    },
  };
}

const MAX_ICON_BYTES = 5 * 1024 * 1024;
const MAX_ICON_DIMENSION = 192;
const MAX_ICON_CHARS = 512_000;

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read that image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('That image could not be opened.'));
    image.src = src;
  });
}

/**
 * Turn a picked file into a small data URL for the sidebar logo: SVGs are kept
 * as-is (they are already tiny and stay sharp), raster images are downscaled
 * to at most 192px and compressed as WebP so the upload always fits comfortably
 * in browser storage.
 */
async function buildIconDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Choose an image file (PNG, JPG, WebP or SVG).');
  }
  if (file.size > MAX_ICON_BYTES) {
    throw new Error('Images must be smaller than 5 MB.');
  }
  if (file.type === 'image/svg+xml') {
    const dataUrl = await readAsDataUrl(file);
    if (dataUrl.length > MAX_ICON_CHARS) {
      throw new Error('That SVG is too large — keep it under 512 KB.');
    }
    return dataUrl;
  }
  const source = await readAsDataUrl(file);
  const image = await loadImage(source);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  if (!width || !height) {
    throw new Error('That image has no usable size.');
  }
  const scale = Math.min(1, MAX_ICON_DIMENSION / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Image processing is not available in this browser.');
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  // WebP keeps transparency (logos) and compresses well below the cap; older
  // browsers fall back to PNG inside toDataURL, which is fine too.
  const dataUrl = canvas.toDataURL('image/webp', 0.85);
  if (dataUrl.length > MAX_ICON_CHARS) {
    throw new Error('That image is too heavy even after compression.');
  }
  return dataUrl;
}

export function SettingsPage() {
  const toast = useToast();
  const dispatch = useAppDispatch();
  const restaurantId = useAppSelector((state) => state.auth.user?.restaurantId);
  const restaurantIcon = useRestaurantIcon(restaurantId);
  const [iconBusy, setIconBusy] = useState(false);
  const [iconError, setIconError] = useState<string | null>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);
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
      // Refresh the session profile so the sidebar shows the saved restaurant
      // name immediately instead of waiting for the next page load.
      dispatch(apiSlice.util.invalidateTags(['Me']));
      toast.success('Settings saved', 'Restaurant settings have been updated.');
    } catch (error) {
      toast.error('Could not save settings', extractApiError(error).message);
    }
  }

  async function handleIconPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Reset so picking the same file again still fires a change event.
    event.target.value = '';
    if (!file || !restaurantId) return;
    setIconBusy(true);
    setIconError(null);
    try {
      const dataUrl = await buildIconDataUrl(file);
      writeRestaurantIcon(restaurantId, dataUrl);
      toast.success('Restaurant icon updated', 'It now appears in the sidebar.');
    } catch (error) {
      setIconError(error instanceof Error ? error.message : 'Could not process that image.');
    } finally {
      setIconBusy(false);
    }
  }

  function handleIconRemove() {
    if (!restaurantId) return;
    removeRestaurantIcon(restaurantId);
    setIconError(null);
    toast.success('Restaurant icon removed', 'The default logo is back in the sidebar.');
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
        {restaurantId && (
          <Card title="Restaurant icon">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                {restaurantIcon ? (
                  <img
                    src={restaurantIcon}
                    alt="Current restaurant icon"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <UtensilsCrossed className="h-6 w-6 text-slate-400" />
                )}
              </span>
              <div className="flex min-w-0 flex-col gap-1.5">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-secondary"
                    disabled={iconBusy}
                    onClick={() => iconInputRef.current?.click()}
                  >
                    {iconBusy ? <Spinner className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                    {restaurantIcon ? 'Replace icon' : 'Upload icon'}
                  </button>
                  {restaurantIcon && (
                    <button
                      type="button"
                      className="btn-danger"
                      disabled={iconBusy}
                      onClick={handleIconRemove}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  PNG, JPG, WebP or SVG up to&nbsp;5&nbsp;MB. It replaces the logo beside the
                  restaurant name in the sidebar and is saved on this device.
                </p>
                {iconError && <p className="text-xs font-medium text-red-600">{iconError}</p>}
              </div>
            </div>
            <input
              ref={iconInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-label="Upload restaurant icon"
              onChange={handleIconPick}
            />
          </Card>
        )}
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
                <input type="checkbox" className="checkbox" {...register('showTaxOnReceipt')} />
                Show tax on receipts
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="checkbox"
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