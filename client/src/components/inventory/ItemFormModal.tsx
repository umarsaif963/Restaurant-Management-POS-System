import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { STOCK_UNITS } from '@restaurant/shared';
import type { InventoryItemProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateInventoryItemMutation, useUpdateInventoryItemMutation } from '@/store/api/inventoryApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { CATEGORIES, STOCK_UNIT_LABELS } from '@/constants/inventory';

const DECIMAL = /^\d{1,9}(\.\d{1,3})?$/;
const MONEY = /^\d{1,9}(\.\d{1,2})?$/;

const itemFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be at most 120 characters'),
  sku: z.string().trim().max(64, 'SKU must be at most 64 characters'),
  unit: z.enum(STOCK_UNITS),
  quantity: z.string().trim().regex(DECIMAL, 'Enter a valid quantity'),
  minQuantity: z.string().trim().regex(DECIMAL, 'Enter a valid minimum quantity'),
  costPrice: z.string().trim().regex(MONEY, 'Enter a valid cost price'),
  category: z.string().trim().max(80, 'Category must be at most 80 characters'),
  expiryDate: z.string(),
  isActive: z.boolean(),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

interface ItemFormModalProps {
  open: boolean;
  item: InventoryItemProfile | null;
  onClose: () => void;
}

export function ItemFormModal({ open, item, onClose }: ItemFormModalProps) {
  const toast = useToast();
  const isEdit = item !== null;

  const [createItem, { isLoading: creating }] = useCreateInventoryItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateInventoryItemMutation();
  const busy = creating || updating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: '',
      sku: '',
      unit: 'PIECE',
      quantity: '0',
      minQuantity: '0',
      costPrice: '0',
      category: '',
      expiryDate: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        item
          ? {
              name: item.name,
              sku: item.sku ?? '',
              unit: item.unit,
              quantity: item.quantity,
              minQuantity: item.minQuantity,
              costPrice: item.costPrice,
              category: item.category ?? '',
              expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
              isActive: item.isActive,
            }
          : {
              name: '',
              sku: '',
              unit: 'PIECE',
              quantity: '0',
              minQuantity: '0',
              costPrice: '0',
              category: '',
              expiryDate: '',
              isActive: true,
            },
      );
    }
  }, [open, item, reset]);

  async function onSubmit(values: ItemFormValues) {
    try {
      if (isEdit) {
        await updateItem({
          id: item.id,
          data: {
            name: values.name,
            sku: values.sku === '' ? null : values.sku,
            unit: values.unit,
            minQuantity: values.minQuantity,
            costPrice: values.costPrice,
            category: values.category === '' ? null : values.category,
            expiryDate: values.expiryDate === '' ? null : values.expiryDate,
            isActive: values.isActive,
          },
        }).unwrap();
        toast.success('Item updated', `${values.name} was saved.`);
      } else {
        const created = await createItem({
          name: values.name,
          sku: values.sku === '' ? null : values.sku,
          unit: values.unit,
          quantity: values.quantity,
          minQuantity: values.minQuantity,
          costPrice: values.costPrice,
          category: values.category === '' ? null : values.category,
          expiryDate: values.expiryDate === '' ? null : values.expiryDate,
          isActive: values.isActive,
        }).unwrap();
        toast.success('Item created', `${created.name} added to inventory.`);
      }
      onClose();
    } catch (error) {
      toast.error(isEdit ? 'Could not update item' : 'Could not create item', extractApiError(error).message);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit: ${item.name}` : 'Add inventory item'}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="inventory-item-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Add item'}
          </button>
        </>
      }
    >
      <form id="inventory-item-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor="inv-name" error={errors.name?.message} required>
            <input id="inv-name" className="input" placeholder="e.g. Burger Buns" {...register('name')} />
          </FormField>
          <FormField label="SKU" htmlFor="inv-sku" error={errors.sku?.message} hint="Optional. Must be unique.">
            <input id="inv-sku" className="input" placeholder="ING-001" {...register('sku')} />
          </FormField>
          <FormField label="Unit" htmlFor="inv-unit" error={errors.unit?.message} required>
            <select id="inv-unit" className="input" {...register('unit')}>
              {STOCK_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {STOCK_UNIT_LABELS[unit]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Category" htmlFor="inv-category" error={errors.category?.message}>
            <input
              id="inv-category"
              className="input"
              placeholder="Bakery"
              list="inv-category-list"
              {...register('category')}
            />
            <datalist id="inv-category-list">
              {CATEGORIES.map((category) => (
                <option key={category} value={category} />
              ))}
            </datalist>
          </FormField>
          <FormField
            label="Quantity"
            htmlFor="inv-quantity"
            error={errors.quantity?.message}
            hint={isEdit ? 'Use "Record movement" to change stock.' : 'Opening balance'}
          >
            <input
              id="inv-quantity"
              className="input"
              inputMode="decimal"
              disabled={isEdit}
              {...register('quantity')}
            />
          </FormField>
          <FormField label="Minimum quantity" htmlFor="inv-min" error={errors.minQuantity?.message}>
            <input id="inv-min" className="input" inputMode="decimal" {...register('minQuantity')} />
          </FormField>
          <FormField label="Cost price" htmlFor="inv-cost" error={errors.costPrice?.message}>
            <input id="inv-cost" className="input" inputMode="decimal" placeholder="1.20" {...register('costPrice')} />
          </FormField>
          <FormField label="Expiry date" htmlFor="inv-expiry" error={errors.expiryDate?.message} hint="Optional">
            <input id="inv-expiry" type="date" className="input" {...register('expiryDate')} />
          </FormField>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Availability</span>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="checkbox" {...register('isActive')} />
            Active (orderable)
          </label>
        </div>
      </form>
    </Modal>
  );
}