import { useEffect, useState } from 'react';
import { ClipboardList, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import type {
  InventoryItemProfile,
  ListPurchasesQuery,
  PurchaseProfile,
  PurchaseStatus,
  SupplierProfile,
  UserRole,
} from '@restaurant/shared';
import { PURCHASE_STATUSES } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { PurchaseFormModal } from '@/components/purchases/PurchaseFormModal';
import { PurchaseDetailModal } from '@/components/purchases/PurchaseDetailModal';
import {
  useDeletePurchaseMutation,
  useListPurchasesQuery,
} from '@/store/api/purchaseApi';
import { useListSuppliersQuery } from '@/store/api/supplierApi';
import { useListInventoryItemQuery } from '@/store/api/inventoryApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { PURCHASE_STATUS_BADGE, PURCHASE_STATUS_LABELS } from '@/constants/supply';

const PAGE_SIZE = 20;
const MANAGER_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER'];

export function PurchasesPage() {
  const toast = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canManage = currentUser ? MANAGER_ROLES.includes(currentUser.role) : false;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PurchaseStatus | ''>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PurchaseProfile | null>(null);
  const [viewing, setViewing] = useState<PurchaseProfile | null>(null);
  const [toDelete, setToDelete] = useState<PurchaseProfile | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status]);

  const query: ListPurchasesQuery = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    status: status || undefined,
  };

  const { data, isError, isFetching, refetch } = useListPurchasesQuery(query);
  const { data: suppliers = { items: [], total: 0 } } = useListSuppliersQuery({ limit: 100 });
  const { data: inventory = { items: [], total: 0 } } = useListInventoryItemQuery({ limit: 100 });
  const [deletePurchase, { isLoading: deleting }] = useDeletePurchaseMutation();

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deletePurchase(toDelete.id).unwrap();
      toast.success('Purchase deleted', `${toDelete.purchaseNumber} was removed.`);
      setToDelete(null);
    } catch (error) {
      toast.error('Could not delete purchase', extractApiErrorField(error));
    }
  }

  const supplierOptions: SupplierProfile[] = suppliers.items;
  const inventoryOptions: InventoryItemProfile[] = inventory.items.filter((item) => item.isActive);

  return (
    <div>
      <PageHeader
        title="Purchases"
        description="Purchase orders against suppliers — receive goods to restock inventory."
        actions={
          canManage && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              New purchase
            </button>
          )
        }
      />

      <section className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                className="input pl-9"
                placeholder="Search PO number or supplier…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search purchases"
              />
            </div>
            <select
              className="input w-auto"
              value={status}
              onChange={(event) => setStatus(event.target.value as PurchaseStatus | '')}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {PURCHASE_STATUSES.map((state) => (
                <option key={state} value={state}>
                  {PURCHASE_STATUS_LABELS[state]}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card>
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-slate-500">Could not load purchases.</p>
              <button type="button" className="btn-secondary" onClick={() => refetch()}>
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Order</th>
                    <th className="px-4 py-3 font-semibold">Supplier</th>
                    <th className="px-4 py-3 font-semibold">Items</th>
                    <th className="px-4 py-3 font-semibold">Total</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isFetching && !data ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3" colSpan={6}>
                          <Skeleton className="h-5 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : data && data.items.length > 0 ? (
                    data.items.map((purchase) => (
                      <tr key={purchase.id} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{purchase.purchaseNumber}</p>
                          <p className="text-xs text-slate-400">{new Date(purchase.createdAt).toLocaleDateString()}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{purchase.supplierName}</td>
                        <td className="px-4 py-3 text-slate-600">{purchase.itemCount}</td>
                        <td className="px-4 py-3 font-semibold text-slate-800">${purchase.totalAmount}</td>
                        <td className="px-4 py-3">
                          <Badge variant={PURCHASE_STATUS_BADGE[purchase.status]}>
                            {PURCHASE_STATUS_LABELS[purchase.status]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewing(purchase)}
                              className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              title="View order"
                              aria-label={`View ${purchase.purchaseNumber}`}
                            >
                              <ClipboardList className="h-4 w-4" />
                            </button>
                            {canManage && purchase.status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditing(purchase);
                                    setFormOpen(true);
                                  }}
                                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                  title="Edit purchase"
                                  aria-label={`Edit ${purchase.purchaseNumber}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setToDelete(purchase)}
                                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                  title="Delete purchase"
                                  aria-label={`Delete ${purchase.purchaseNumber}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6}>
                        <EmptyState
                          icon={<ClipboardList className="h-6 w-6" />}
                          title={debouncedSearch || status ? 'No purchases found' : 'No purchases yet'}
                          description={
                            debouncedSearch || status
                              ? 'Try adjusting your search or filters.'
                              : 'Create a purchase order to record goods you are buying from suppliers.'
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {data && data.total > 0 && (
            <div className="border-t border-slate-100 px-4 py-3">
              <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
            </div>
          )}
          {isFetching && data && (
            <div className="flex justify-center border-t border-slate-100 py-3">
              <Spinner className="h-4 w-4 text-slate-400" />
            </div>
          )}
        </Card>
      </section>

      <PurchaseFormModal
        open={formOpen}
        purchase={editing}
        suppliers={supplierOptions}
        inventoryItems={inventoryOptions}
        onClose={() => setFormOpen(false)}
      />
      <PurchaseDetailModal open={viewing !== null} purchase={viewing} manager={canManage} onClose={() => setViewing(null)} />

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete purchase"
        message={toDelete ? `Delete ${toDelete.purchaseNumber}? Only pending orders can be deleted.` : ''}
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function extractApiErrorField(error: unknown): string {
  const anyError = error as { data?: { message?: string } };
  return anyError.data?.message ?? 'Try again.';
}