import { useState } from 'react';
import { Truck, XCircle } from 'lucide-react';
import type { PurchaseProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useChangePurchaseStatusMutation } from '@/store/api/purchaseApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { PURCHASE_STATUS_BADGE, PURCHASE_STATUS_LABELS } from '@/constants/supply';
import { STOCK_UNIT_LABELS } from '@/constants/inventory';

interface PurchaseDetailModalProps {
  open: boolean;
  purchase: PurchaseProfile | null;
  manager: boolean;
  onClose: () => void;
}

export function PurchaseDetailModal({ open, purchase, manager, onClose }: PurchaseDetailModalProps) {
  const toast = useToast();
  const [confirmAction, setConfirmAction] = useState<'RECEIVE' | 'CANCEL' | null>(null);
  const [changeStatus, { isLoading }] = useChangePurchaseStatusMutation();

  if (!purchase) return null;
  const current = purchase;

  const isPending = current.status === 'PENDING';

  async function runConfirmedAction(action: 'RECEIVE' | 'CANCEL') {
    try {
      await changeStatus({ id: current.id, data: { status: action === 'RECEIVE' ? 'RECEIVED' : 'CANCELLED' } }).unwrap();
      toast.success(
        action === 'RECEIVE' ? 'Purchase received' : 'Purchase cancelled',
        action === 'RECEIVE'
          ? 'Stock levels and the ledger were updated from this order.'
          : `${current.purchaseNumber} is cancelled and will not affect stock.`,
      );
      setConfirmAction(null);
      onClose();
    } catch (error) {
      toast.error(
        action === 'RECEIVE' ? 'Could not receive purchase' : 'Could not cancel purchase',
        extractApiError(error).message,
      );
    }
  }

  return (
    <Modal
      open={open}
      title={`Purchase ${current.purchaseNumber}`}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <span className="mr-auto text-sm text-slate-500">
            Total: <span className="font-semibold text-slate-800">${current.totalAmount}</span>
          </span>
          {isPending && manager && (
            <>
              <button type="button" className="btn-secondary" onClick={() => setConfirmAction('CANCEL')}>
                <XCircle className="h-4 w-4" />
                Cancel order
              </button>
              <button type="button" className="btn-primary" onClick={() => setConfirmAction('RECEIVE')}>
                <Truck className="h-4 w-4" />
                Receive goods
              </button>
            </>
          )}
          <button type="button" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400">Status</span>
            <p>
              <Badge variant={PURCHASE_STATUS_BADGE[current.status]}>{PURCHASE_STATUS_LABELS[current.status]}</Badge>
            </p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400">Supplier</span>
            <p className="font-medium text-slate-800">{current.supplierName}</p>
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider text-slate-400">Created</span>
            <p className="text-slate-600">{new Date(current.createdAt).toLocaleDateString()}</p>
          </div>
          {current.receivedAt && (
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400">Received</span>
              <p className="text-slate-600">{new Date(current.receivedAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {current.notes && <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">{current.notes}</p>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-2 font-semibold">Item</th>
                <th className="px-4 py-2 font-semibold">Quantity</th>
                <th className="px-4 py-2 font-semibold">Unit cost</th>
                <th className="px-4 py-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {current.items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-2 font-medium text-slate-800">
                    {item.itemName}
                    <span className="ml-1 text-xs font-normal text-slate-400">({STOCK_UNIT_LABELS[item.unit]})</span>
                  </td>
                  <td className="px-4 py-2 text-slate-600">{item.quantity}</td>
                  <td className="px-4 py-2 text-slate-600">${item.unitCost}</td>
                  <td className="px-4 py-2 text-right font-medium text-slate-800">${item.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-xs text-slate-500">
          {isPending
            ? 'Receiving this order adds every line to stock and adopts the unit cost onto the items.'
            : current.status === 'RECEIVED'
              ? 'Goods were received into inventory with a PURCHASE ledger entry.'
              : 'This cancelled order had no effect on stock.'}
        </p>
      </div>

      <ConfirmDialog
        open={confirmAction === 'RECEIVE'}
        title="Receive goods"
        message={`Receive ${current.purchaseNumber}? ${current.itemCount} line${current.itemCount === 1 ? '' : 's'} will be added to inventory and item unit costs updated. This cannot be undone.`}
        confirmLabel="Receive goods"
        busy={isLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => runConfirmedAction('RECEIVE')}
      />
      <ConfirmDialog
        open={confirmAction === 'CANCEL'}
        title="Cancel purchase"
        message={`Cancel ${current.purchaseNumber}? Stock is not affected.`}
        confirmLabel="Cancel purchase"
        busy={isLoading}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => runConfirmedAction('CANCEL')}
      />
    </Modal>
  );
}