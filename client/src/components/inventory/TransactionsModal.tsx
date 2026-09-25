import type { InventoryItemProfile, ListInventoryTransactionsQuery } from '@restaurant/shared';
import { Link } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { History } from 'lucide-react';
import { useListInventoryTransactionsQuery } from '@/store/api/inventoryApi';
import { formatDateTime } from '@/utils/format';
import { INVENTORY_TRANSACTION_TYPE_BADGE, INVENTORY_TRANSACTION_TYPE_LABELS } from '@/constants/inventory';

interface TransactionsModalProps {
  open: boolean;
  item: InventoryItemProfile | null;
  onClose: () => void;
}

export function TransactionsModal({ open, item, onClose }: TransactionsModalProps) {
  const query: ListInventoryTransactionsQuery | undefined = item ? { itemId: item.id, limit: 50 } : undefined;
  const { data, isFetching } = useListInventoryTransactionsQuery(query, { skip: !item });

  return (
    <Modal
      open={open}
      title={item ? `Ledger: ${item.name}` : 'Movement ledger'}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
    >
      {isFetching && !data ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : data && data.items.length > 0 ? (
        <div className="divide-y divide-slate-50">
          {data.items.map((txn) => (
            <div key={txn.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant={INVENTORY_TRANSACTION_TYPE_BADGE[txn.type]}>
                    {INVENTORY_TRANSACTION_TYPE_LABELS[txn.type]}
                  </Badge>
                  <span className="font-medium text-slate-800">{txn.quantity}</span>
                </div>
                {txn.order && (
                  <p className="mt-1">
                    <Link
                      to={`/orders?order=${txn.order.id}`}
                      className="text-xs font-semibold text-brand-700 transition hover:underline"
                    >
                      {txn.order.orderNumber} →
                    </Link>
                  </p>
                )}
                {txn.note && <p className="mt-1 text-xs text-slate-500">{txn.note}</p>}
                <p className="mt-1 text-xs text-slate-400">
                  {formatDateTime(txn.createdAt)} · {txn.userName ?? 'System'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">Balance {txn.balanceAfter ?? '—'}</p>
                {txn.unitCost && <p className="text-xs text-slate-400">unit cost ${txn.unitCost}</p>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<History className="h-6 w-6" />}
          title="No movements yet"
          description="Record purchases, sales, adjustments or wastage to build a ledger."
        />
      )}
    </Modal>
  );
}