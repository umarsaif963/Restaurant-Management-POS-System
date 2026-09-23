import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import type { InventoryItemProfile, PurchaseProfile, SupplierProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useCreatePurchaseMutation, useUpdatePurchaseMutation } from '@/store/api/purchaseApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { STOCK_UNIT_LABELS } from '@/constants/inventory';

const purchaseFormSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  notes: z.string().trim().max(400, 'Notes must be at most 400 characters'),
});

type PurchaseFormValues = z.infer<typeof purchaseFormSchema>;

interface LineDraft {
  inventoryItemId: string;
  quantity: string;
  unitCost: string;
}

interface PurchaseFormModalProps {
  open: boolean;
  purchase: PurchaseProfile | null;
  suppliers: SupplierProfile[];
  inventoryItems: InventoryItemProfile[];
  onClose: () => void;
}

function lineTotal(quantity: string, unitCost: string): number {
  if (!quantity || !unitCost) return 0;
  const qty = Number(quantity);
  const cost = Number(unitCost);
  if (!Number.isFinite(qty) || !Number.isFinite(cost)) return 0;
  return Math.round(qty * cost * 100) / 100;
}

export function PurchaseFormModal({ open, purchase, suppliers, inventoryItems, onClose }: PurchaseFormModalProps) {
  const toast = useToast();
  const isEdit = purchase !== null;

  const [createPurchase, { isLoading: creating }] = useCreatePurchaseMutation();
  const [updatePurchase, { isLoading: updating }] = useUpdatePurchaseMutation();
  const busy = creating || updating;

  const [lines, setLines] = useState<LineDraft[]>([{ inventoryItemId: '', quantity: '', unitCost: '' }]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseFormSchema),
    defaultValues: { supplierId: '', notes: '' },
  });

  useEffect(() => {
    if (open) {
      reset(
        purchase
          ? { supplierId: purchase.supplierId, notes: purchase.notes ?? '' }
          : { supplierId: suppliers[0]?.id ?? '', notes: '' },
      );
      setLines(
        purchase && purchase.items.length > 0
          ? purchase.items.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              quantity: item.quantity,
              unitCost: item.unitCost,
            }))
          : [{ inventoryItemId: inventoryItems[0]?.id ?? '', quantity: '', unitCost: '' }],
      );
    }
  }, [open, purchase, suppliers, inventoryItems, reset]);

  const total = useMemo(
    () => lines.reduce((sum, line) => sum + lineTotal(line.quantity, line.unitCost), 0),
    [lines],
  );

  async function onSubmit(values: PurchaseFormValues) {
    const clean = lines.filter((line) => line.inventoryItemId && line.quantity.trim() && line.unitCost.trim());
    if (clean.length === 0) {
      toast.error('Purchase needs items', 'Add at least one item with a quantity and unit cost.');
      return;
    }
    const items = clean.map((line) => ({
      inventoryItemId: line.inventoryItemId,
      quantity: line.quantity.trim(),
      unitCost: line.unitCost.trim(),
    }));
    const notes = values.notes === '' ? null : values.notes.trim();
    try {
      if (isEdit) {
        await updatePurchase({ id: purchase.id, data: { notes, items } }).unwrap();
        toast.success('Purchase updated', `${purchase.purchaseNumber} was saved.`);
      } else {
        const created = await createPurchase({ supplierId: values.supplierId, notes, items }).unwrap();
        toast.success('Purchase created', `${created.purchaseNumber} is ready to be received.`);
      }
      onClose();
    } catch (error) {
      toast.error(isEdit ? 'Could not update purchase' : 'Could not create purchase', extractApiError(error).message);
    }
  }

  function updateLine(index: number, patch: Partial<LineDraft>) {
    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit: ${purchase.purchaseNumber}` : 'New purchase order'}
      onClose={onClose}
      maxWidthClass="max-w-3xl"
      footer={
        <>
          <span className="mr-auto text-sm text-slate-500">
            Total: <span className="font-semibold text-slate-800">${total.toFixed(2)}</span>
          </span>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="purchase-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Create purchase'}
          </button>
        </>
      }
    >
      <form id="purchase-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Supplier" htmlFor="pur-supplier" error={errors.supplierId?.message} required>
            <select id="pur-supplier" className="input" {...register('supplierId')} disabled={isEdit}>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                  {supplier.company ? ` — ${supplier.company}` : ''}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Notes" htmlFor="pur-notes" error={errors.notes?.message} hint="Optional">
            <input id="pur-notes" className="input" placeholder="Delivery window, payment terms…" {...register('notes')} />
          </FormField>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Items</span>
            <button
              type="button"
              className="btn-secondary !px-2 !py-1 text-xs"
              onClick={() => setLines((rows) => [...rows, { inventoryItemId: '', quantity: '', unitCost: '' }])}
            >
              <Plus className="h-3 w-3" />
              Add item
            </button>
          </div>
          <div className="space-y-2">
            {lines.map((line, index) => (
              <div key={index} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                <select
                  className="input flex-1 !py-1.5"
                  value={line.inventoryItemId}
                  aria-label="Inventory item"
                  onChange={(event) => updateLine(index, { inventoryItemId: event.target.value })}
                >
                  <option value="">Select item…</option>
                  {inventoryItems.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({STOCK_UNIT_LABELS[item.unit]})
                    </option>
                  ))}
                </select>
                <input
                  className="input !py-1.5 w-24"
                  placeholder="Qty"
                  inputMode="decimal"
                  value={line.quantity}
                  aria-label="Quantity"
                  onChange={(event) => updateLine(index, { quantity: event.target.value })}
                />
                <span className="w-10 shrink-0 text-xs text-slate-400">
                  {line.inventoryItemId ? STOCK_UNIT_LABELS[inventoryItems.find((it) => it.id === line.inventoryItemId)?.unit ?? 'PIECE'] : ''}
                </span>
                <input
                  className="input !py-1.5 w-28"
                  placeholder="Unit cost"
                  inputMode="decimal"
                  value={line.unitCost}
                  aria-label="Unit cost"
                  onChange={(event) => updateLine(index, { unitCost: event.target.value })}
                />
                <span className="w-20 shrink-0 text-right text-xs font-medium text-slate-600">
                  ${lineTotal(line.quantity, line.unitCost).toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => setLines((rows) => rows.filter((_, i) => i !== index))}
                  className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                  aria-label="Remove line"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          {lines.some((line) => line.inventoryItemId && (!line.quantity.trim() || !line.unitCost.trim())) && (
            <p className="mt-2 text-xs text-amber-600">Every item needs a quantity and a unit cost.</p>
          )}
        </div>
        <p className="text-xs text-slate-500">
          Duplicate rows for the same item are merged on receipt (weighted-average unit cost).
        </p>
      </form>
    </Modal>
  );
}