import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { MENU_ITEM_STATUSES } from '@restaurant/shared';
import type { MenuCategoryProfile, MenuItemProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import {
  useCreateAddOnMutation,
  useCreateItemMutation,
  useCreateVariationMutation,
  useDeleteAddOnMutation,
  useDeleteVariationMutation,
  useUpdateAddOnMutation,
  useUpdateItemMutation,
  useUpdateVariationMutation,
} from '@/store/api/menuApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { MENU_ITEM_STATUS_LABELS } from '@/constants/menu';

const itemFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  price: z.string().trim().regex(/^\d{1,6}(\.\d{1,2})?$/, 'Enter a valid price, e.g. 9.50'),
  sku: z.string().trim().max(20, 'SKU must be at most 20 characters'),
  categoryId: z.string().min(1, 'Category is required'),
  taxRate: z.string().trim().regex(/^\d{1,3}(\.\d{1,2})?$/, 'Enter a valid percentage'),
  preparationTime: z.string(),
  description: z.string().trim().max(500, 'Description must be at most 500 characters'),
  imageUrl: z.string().trim().max(500, 'Image URL must be at most 500 characters'),
  position: z.string(),
  available: z.boolean(),
  status: z.enum(MENU_ITEM_STATUSES),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

interface VariationDraft {
  id?: string;
  name: string;
  priceAdjustment: string;
  isDefault: boolean;
}

interface AddOnDraft {
  id?: string;
  name: string;
  price: string;
  available: boolean;
}

interface ItemFormModalProps {
  open: boolean;
  item: MenuItemProfile | null;
  categories: MenuCategoryProfile[];
  onClose: () => void;
}

export function ItemFormModal({ open, item, categories, onClose }: ItemFormModalProps) {
  const toast = useToast();
  const isEdit = item !== null;

  const [createItem, { isLoading: creating }] = useCreateItemMutation();
  const [updateItem, { isLoading: updating }] = useUpdateItemMutation();
  const [createVariation] = useCreateVariationMutation();
  const [updateVariation] = useUpdateVariationMutation();
  const [deleteVariation] = useDeleteVariationMutation();
  const [createAddOn] = useCreateAddOnMutation();
  const [updateAddOn] = useUpdateAddOnMutation();
  const [deleteAddOn] = useDeleteAddOnMutation();

  const busy = creating || updating;

  const [variations, setVariations] = useState<VariationDraft[]>([]);
  const [addOns, setAddOns] = useState<AddOnDraft[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: '',
      price: '',
      sku: '',
      categoryId: '',
      taxRate: '0',
      preparationTime: '',
      description: '',
      imageUrl: '',
      position: '0',
      available: true,
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (open) {
      reset(
        item
          ? {
              name: item.name,
              price: item.price,
              sku: item.sku ?? '',
              categoryId: item.categoryId,
              taxRate: item.taxRate,
              preparationTime: item.preparationTime ? String(item.preparationTime) : '',
              description: item.description ?? '',
              imageUrl: item.imageUrl ?? '',
              position: String(item.position),
              available: item.available,
              status: item.status,
            }
          : {
              name: '',
              price: '',
              sku: '',
              categoryId: categories[0]?.id ?? '',
              taxRate: '0',
              preparationTime: '',
              description: '',
              imageUrl: '',
              position: '0',
              available: true,
              status: 'ACTIVE',
            },
      );
      setVariations(
        item
          ? item.variations.map((variation) => ({
              id: variation.id,
              name: variation.name,
              priceAdjustment: variation.priceAdjustment,
              isDefault: variation.isDefault,
            }))
          : [],
      );
      setAddOns(
        item
          ? item.addOns.map((addOn) => ({
              id: addOn.id,
              name: addOn.name,
              price: addOn.price,
              available: addOn.available,
            }))
          : [],
      );
    }
  }, [open, item, categories, reset]);

  function setVariationDefault(index: number) {
    setVariations((rows) =>
      rows.map((row, i) => ({ ...row, isDefault: i === index })),
    );
  }

  function persistVariations(itemId: string) {
    const original = item?.variations ?? [];
    const retainedIds = new Set(variations.map((row) => row.id).filter(Boolean));
    const removed = original.filter((variation) => !retainedIds.has(variation.id));
    const changedById = new Map(original.map((variation) => [variation.id, variation]));

    const results: Promise<unknown>[] = removed.map((variation) =>
      deleteVariation(variation.id).unwrap(),
    );

    for (const row of variations) {
      if (row.id) {
        const originalRow = changedById.get(row.id);
        if (
          !originalRow ||
          originalRow.name !== row.name ||
          originalRow.priceAdjustment !== row.priceAdjustment ||
          originalRow.isDefault !== row.isDefault
        ) {
          results.push(
            updateVariation({
              id: row.id,
              data: {
                name: row.name,
                priceAdjustment: row.priceAdjustment,
                isDefault: row.isDefault,
              },
            }).unwrap(),
          );
        }
      } else if (row.name.trim()) {
        results.push(
          createVariation({
            itemId,
            data: {
              name: row.name.trim(),
              priceAdjustment: row.priceAdjustment,
              isDefault: row.isDefault,
            },
          }).unwrap(),
        );
      }
    }
    return results;
  }

  function persistAddOns(itemId: string) {
    const original = item?.addOns ?? [];
    const retainedIds = new Set(addOns.map((row) => row.id).filter(Boolean));
    const removed = original.filter((addOn) => !retainedIds.has(addOn.id));
    const changedById = new Map(original.map((addOn) => [addOn.id, addOn]));

    const results: Promise<unknown>[] = removed.map((addOn) => deleteAddOn(addOn.id).unwrap());

    for (const row of addOns) {
      if (row.id) {
        const originalRow = changedById.get(row.id);
        if (
          !originalRow ||
          originalRow.name !== row.name ||
          originalRow.price !== row.price ||
          originalRow.available !== row.available
        ) {
          results.push(
            updateAddOn({
              id: row.id,
              data: { name: row.name, price: row.price, available: row.available },
            }).unwrap(),
          );
        }
      } else if (row.name.trim()) {
        results.push(
          createAddOn({
            itemId,
            data: { name: row.name.trim(), price: row.price, available: row.available },
          }).unwrap(),
        );
      }
    }
    return results;
  }

  async function onSubmit(values: ItemFormValues) {
    const scalars = {
      name: values.name,
      price: values.price,
      sku: values.sku === '' ? null : values.sku,
      categoryId: values.categoryId,
      taxRate: values.taxRate,
      preparationTime: values.preparationTime === '' ? null : Number(values.preparationTime),
      description: values.description === '' ? null : values.description,
      imageUrl: values.imageUrl === '' ? null : values.imageUrl,
      position: Number(values.position) || 0,
      available: values.available,
    };

    try {
      if (isEdit) {
        await updateItem({ id: item.id, data: { ...scalars, status: values.status } }).unwrap();
        await Promise.all([
          ...persistVariations(item.id),
          ...persistAddOns(item.id),
        ]);
        toast.success('Item updated', `${values.name} was saved.`);
      } else {
        const created = await createItem({
          ...scalars,
          variations: variations.filter((row) => row.name.trim()).map((row) => ({
            name: row.name.trim(),
            priceAdjustment: row.priceAdjustment,
            isDefault: row.isDefault,
          })),
          addOns: addOns.filter((row) => row.name.trim()).map((row) => ({
            name: row.name.trim(),
            price: row.price,
            available: row.available,
          })),
        }).unwrap();
        toast.success('Item created', `${created.name} added to the menu.`);
      }
      onClose();
    } catch (error) {
      toast.error(isEdit ? 'Could not update item' : 'Could not create item', extractApiError(error).message);
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit: ${item.name}` : 'Add menu item'}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="item-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Add item'}
          </button>
        </>
      }
    >
      <form id="item-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor="item-name" error={errors.name?.message} required>
            <input id="item-name" className="input" placeholder="e.g. Classic Cheeseburger" {...register('name')} />
          </FormField>
          <FormField label="Price" htmlFor="item-price" error={errors.price?.message} required>
            <input id="item-price" className="input" placeholder="9.50" inputMode="decimal" {...register('price')} />
          </FormField>
          <FormField label="Category" htmlFor="item-category" error={errors.categoryId?.message} required>
            <select id="item-category" className="input" {...register('categoryId')}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="SKU" htmlFor="item-sku" error={errors.sku?.message} hint="Optional. Must be unique.">
            <input id="item-sku" className="input" placeholder="BUR-001" {...register('sku')} />
          </FormField>
          <FormField label="Tax rate %" htmlFor="item-tax" error={errors.taxRate?.message}>
            <input id="item-tax" className="input" placeholder="10" inputMode="decimal" {...register('taxRate')} />
          </FormField>
          <FormField
            label="Preparation (minutes)"
            htmlFor="item-prep"
            error={errors.preparationTime?.message}
          >
            <input id="item-prep" type="number" min={1} className="input" {...register('preparationTime')} />
          </FormField>
          <FormField label="Position" htmlFor="item-position" error={errors.position?.message}>
            <input id="item-position" type="number" min={0} className="input" {...register('position')} />
          </FormField>
          <FormField label="Status" htmlFor="item-status">
            <select id="item-status" className="input" {...register('status')} disabled={!isEdit}>
              {MENU_ITEM_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {MENU_ITEM_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Description" htmlFor="item-description" error={errors.description?.message}>
          <textarea id="item-description" rows={2} className="input" placeholder="Optional" {...register('description')} />
        </FormField>

        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Availability</span>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="checkbox" {...register('available')} />
            Available for ordering
          </label>
        </div>

        {/* Variations */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Variations</span>
            <button
              type="button"
              className="btn-secondary !px-2 !py-1 text-xs"
              onClick={() =>
                setVariations((rows) => [
                  ...rows,
                  { name: '', priceAdjustment: rows.some((row) => row.isDefault) ? '0' : '0', isDefault: rows.length === 0 },
                ])
              }
            >
              <Plus className="h-3 w-3" />
              Add variation
            </button>
          </div>
          {variations.length === 0 ? (
            <p className="text-xs text-slate-400">No variations. Useful for sizes like Small / Medium / Large.</p>
          ) : (
            <div className="space-y-2">
              {variations.map((row, index) => (
                <div key={index} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                  <input
                    type="radio"
                    checked={row.isDefault}
                    onChange={() => setVariationDefault(index)}
                    title="Default variation"
                    aria-label={`Mark "${row.name || `variation ${index + 1}`}" as default`}
                  />
                  <input
                    className="input !py-1.5"
                    placeholder="Name (e.g. Double)"
                    value={row.name}
                    onChange={(event) =>
                      setVariations((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, name: event.target.value } : r)),
                      )
                    }
                  />
                  <input
                    className="input !py-1.5 w-24"
                    placeholder="±0.00"
                    value={row.priceAdjustment}
                    onChange={(event) =>
                      setVariations((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, priceAdjustment: event.target.value } : r)),
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => setVariations((rows) => rows.filter((_, i) => i !== index))}
                    className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove variation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add-ons */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Add-ons</span>
            <button
              type="button"
              className="btn-secondary !px-2 !py-1 text-xs"
              onClick={() => setAddOns((rows) => [...rows, { name: '', price: '1.00', available: true }])}
            >
              <Plus className="h-3 w-3" />
              Add add-on
            </button>
          </div>
          {addOns.length === 0 ? (
            <p className="text-xs text-slate-400">No add-ons. Used for extra ingredients or toppings.</p>
          ) : (
            <div className="space-y-2">
              {addOns.map((row, index) => (
                <div key={index} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                  <input
                    className="input !py-1.5"
                    placeholder="Name (e.g. Extra Cheese)"
                    value={row.name}
                    onChange={(event) =>
                      setAddOns((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, name: event.target.value } : r)),
                      )
                    }
                  />
                  <input
                    className="input !py-1.5 w-24"
                    placeholder="1.00"
                    value={row.price}
                    onChange={(event) =>
                      setAddOns((rows) =>
                        rows.map((r, i) => (i === index ? { ...r, price: event.target.value } : r)),
                      )
                    }
                  />
                  <label className="flex shrink-0 items-center gap-1.5 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      className="checkbox"
                      checked={row.available}
                      onChange={(event) =>
                        setAddOns((rows) =>
                          rows.map((r, i) => (i === index ? { ...r, available: event.target.checked } : r)),
                        )
                      }
                    />
                    Available
                  </label>
                  <button
                    type="button"
                    onClick={() => setAddOns((rows) => rows.filter((_, i) => i !== index))}
                    className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove add-on"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
}