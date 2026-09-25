import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { INVENTORY_TRANSACTION_TYPES } from '@restaurant/shared';
import type { InventoryItemProfile, InventoryTransactionType } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useRecordInventoryTransactionMutation } from '@/store/api/inventoryApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { INVENTORY_TRANSACTION_TYPE_LABELS } from '@/constants/inventory';

const DECIMAL = /^\d{1,9}(\.\d{1,3})?$/;

const transactionFormSchema = z.object({
  type: z.enum(INVENTORY_TRANSACTION_TYPES),
  quantity: z.string().trim().regex(DECIMAL, 'Enter a valid quantity').refine((v) => Number(v) > 0, 'Quantity must be greater than zero'),
  note: z.string().trim().max(400, 'Note must be at most 400 characters'),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionModalProps {
  open: boolean;
  item: InventoryItemProfile | null;
  presetType?: InventoryTransactionType;
  presetQuantity?: string;
  onClose: () => void;
}

export function TransactionModal({ open, item, presetType, presetQuantity, onClose }: TransactionModalProps) {
  const toast = useToast();
  const [record, { isLoading: recording }] = useRecordInventoryTransactionMutation();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: { type: presetType ?? 'PURCHASE', quantity: presetQuantity ?? '', note: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ type: presetType ?? 'PURCHASE', quantity: presetQuantity ?? '', note: '' });
    }
  }, [open, presetType, presetQuantity, reset]);

  const type = watch('type');
  const quantity = watch('quantity');
  const isAdjustment = type === 'ADJUSTMENT';
  const balanceHint = isAdjustment
    ? 'New on-hand balance (replaces current quantity).'
    : type === 'PURCHASE' || type === 'RETURN'
      ? `Adds to current balance (${item?.quantity ?? '0'}).`
      : `Deducts from current balance (${item?.quantity ?? '0'}).`;

  async function onSubmit(values: TransactionFormValues) {
    if (!item) return;
    try {
      const created = await record({
        itemId: item.id,
        data: {
          type: values.type,
          quantity: values.quantity,
          note: values.note.trim() === '' ? null : values.note.trim(),
        },
      }).unwrap();
      toast.success(
        'Movement recorded',
        `${item.name} balance is now ${created.balanceAfter ?? item.quantity}.`,
      );
      onClose();
    } catch (error) {
      toast.error('Could not record movement', extractApiError(error).message);
    }
  }

  return (
    <Modal
      open={open}
      title={item ? `Record movement: ${item.name}` : 'Record movement'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={recording}>
            Cancel
          </button>
          <button type="submit" form="transaction-form" className="btn-primary" disabled={recording}>
            {recording ? <Spinner className="h-4 w-4" /> : 'Record'}
          </button>
        </>
      }
    >
      <form id="transaction-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Type" htmlFor="txn-type" error={errors.type?.message} required>
            <select id="txn-type" className="input" {...register('type')}>
              {INVENTORY_TRANSACTION_TYPES.map((txnType) => (
                <option key={txnType} value={txnType}>
                  {INVENTORY_TRANSACTION_TYPE_LABELS[txnType]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField
            label={isAdjustment ? 'New balance' : 'Quantity'}
            htmlFor="txn-quantity"
            error={errors.quantity?.message}
            hint={balanceHint}
            required
          >
            <input id="txn-quantity" className="input" inputMode="decimal" placeholder="0.000" {...register('quantity')} />
          </FormField>
        </div>

        <FormField label="Note" htmlFor="txn-note" error={errors.note?.message} hint="Optional — kept in the ledger">
          <textarea
            id="txn-note"
            rows={2}
            className="input"
            placeholder="e.g. Supplier delivery, stock count, spillage…"
            {...register('note')}
          />
        </FormField>

        {quantity && Number(quantity) > 0 && item && (
          <div className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">
            {isAdjustment
              ? `Balance will become ${quantity}.`
              : type === 'PURCHASE' || type === 'RETURN'
                ? `Balance will become ${Number(item.quantity) + Number(quantity)}.`
                : `Balance will become ${Number(item.quantity) - Number(quantity)}.`}
          </div>
        )}
      </form>
    </Modal>
  );
}