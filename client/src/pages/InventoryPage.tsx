import { useEffect, useState } from 'react';
import { Boxes, History, Pencil, Plus, RotateCw, Search, Trash2 } from 'lucide-react';
import type { InventoryItemProfile, ListInventoryItemsQuery, StockHealth, UserRole } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ItemFormModal } from '@/components/inventory/ItemFormModal';
import { TransactionModal } from '@/components/inventory/TransactionModal';
import { TransactionsModal } from '@/components/inventory/TransactionsModal';
import {
  useDeleteInventoryItemMutation,
  useListInventoryItemQuery,
} from '@/store/api/inventoryApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { STOCK_HEALTH_BADGE, STOCK_HEALTH_LABELS, STOCK_UNIT_LABELS } from '@/constants/inventory';

const PAGE_SIZE = 20;
const MANAGER_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER'];

export function InventoryPage() {
  const toast = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canManage = currentUser ? MANAGER_ROLES.includes(currentUser.role) : false;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [health, setHealth] = useState<StockHealth | ''>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemProfile | null>(null);
  const [recordingOn, setRecordingOn] = useState<InventoryItemProfile | null>(null);
  const [viewingHistory, setViewingHistory] = useState<InventoryItemProfile | null>(null);
  const [toDelete, setToDelete] = useState<InventoryItemProfile | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, health]);

  const query: ListInventoryItemsQuery = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    health: health || undefined,
  };

  const { data, isError, isFetching, refetch } = useListInventoryItemQuery(query);
  const [deleteItem, { isLoading: deleting }] = useDeleteInventoryItemMutation();

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deleteItem(toDelete.id).unwrap();
      toast.success('Item deleted', `${toDelete.name} was removed together with its ledger.`);
      setToDelete(null);
    } catch {
      toast.error('Could not delete item', 'Deactivate it instead if it has history you want to keep.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Inventory"
        description="Stock levels, cost and the movement ledger."
        actions={
          canManage && (
            <button type="button" className="btn-primary" onClick={() => { setEditingItem(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" />
              Add item
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
                placeholder="Search name, SKU or category…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search inventory"
              />
            </div>
            <select className="input w-auto" value={health} onChange={(event) => setHealth(event.target.value as StockHealth | '')} aria-label="Filter by stock health">
              <option value="">All stock levels</option>
              {(Object.keys(STOCK_HEALTH_LABELS) as StockHealth[]).map((state) => (
                <option key={state} value={state}>
                  {STOCK_HEALTH_LABELS[state]}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card>
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-slate-500">Could not load inventory.</p>
              <button type="button" className="btn-secondary" onClick={() => refetch()}>
                <RotateCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold">Stock</th>
                    <th className="px-4 py-3 font-semibold">Unit</th>
                    <th className="px-4 py-3 font-semibold">Cost</th>
                    <th className="px-4 py-3 font-semibold">Health</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isFetching && !data ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3" colSpan={7}>
                          <Skeleton className="h-5 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : data && data.items.length > 0 ? (
                    data.items.map((item) => (
                      <tr key={item.id} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{item.name}</p>
                          {item.sku && <p className="text-xs font-mono text-slate-500">{item.sku}</p>}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {item.quantity}
                          {!item.isActive && (
                            <span className="ml-2 text-xs font-normal text-slate-400">inactive</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{STOCK_UNIT_LABELS[item.unit]}</td>
                        <td className="px-4 py-3 text-slate-600">${item.costPrice}</td>
                        <td className="px-4 py-3">
                          <Badge variant={STOCK_HEALTH_BADGE[item.health]}>{STOCK_HEALTH_LABELS[item.health]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{item.category ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewingHistory(item)}
                              className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                              title="View ledger"
                              aria-label={`View ledger for ${item.name}`}
                            >
                              <History className="h-4 w-4" />
                            </button>
                            {canManage && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setRecordingOn(item)}
                                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                  title="Record movement"
                                  aria-label={`Record movement for ${item.name}`}
                                >
                                  <Boxes className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => { setEditingItem(item); setFormOpen(true); }}
                                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                  title="Edit item"
                                  aria-label={`Edit ${item.name}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setToDelete(item)}
                                  className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                  title="Delete item"
                                  aria-label={`Delete ${item.name}`}
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
                      <td colSpan={7}>
                        <EmptyState
                          icon={<Boxes className="h-6 w-6" />}
                          title={debouncedSearch ? 'No items found' : 'No inventory yet'}
                          description={
                            debouncedSearch ? 'Try adjusting your search or filters.' : 'Add your first inventory item to start tracking stock.'
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

      <ItemFormModal open={formOpen} item={editingItem} onClose={() => setFormOpen(false)} />
      <TransactionModal open={recordingOn !== null} item={recordingOn} onClose={() => setRecordingOn(null)} />
      <TransactionsModal open={viewingHistory !== null} item={viewingHistory} onClose={() => setViewingHistory(null)} />

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete inventory item"
        message={
          toDelete
            ? `Delete "${toDelete.name}"? Its entire movement ledger will be removed too.`
            : ''
        }
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}