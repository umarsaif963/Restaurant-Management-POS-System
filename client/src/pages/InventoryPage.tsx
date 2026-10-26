import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  History,
  Package,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Trash2,
  XCircle,
} from 'lucide-react';
import type { InventoryItemProfile, InventoryTransactionType, ListInventoryItemsQuery, StockHealth, UserRole } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ItemFormModal } from '@/components/inventory/ItemFormModal';
import { TransactionModal } from '@/components/inventory/TransactionModal';
import { TransactionsModal } from '@/components/inventory/TransactionsModal';
import { ReorderSuggestionsCard } from '@/components/inventory/ReorderSuggestionsCard';
import {
  useDeleteInventoryItemMutation,
  useListInventoryItemQuery,
} from '@/store/api/inventoryApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { STOCK_HEALTH_BADGE, STOCK_HEALTH_LABELS, STOCK_UNIT_LABELS } from '@/constants/inventory';
import { formatMoney } from '@/utils/format';

const PAGE_SIZE = 20;
const MANAGER_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER'];

const SUMMARY_TONE = {
  slate: 'bg-slate-100 text-slate-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
} as const;

const SUMMARY_VALUE_TONE = {
  slate: 'text-slate-900',
  green: 'text-emerald-600',
  amber: 'text-amber-600',
  red: 'text-red-600',
} as const;

function SummaryCard({
  label,
  value,
  icon,
  tone,
  loading,
}: {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  tone: keyof typeof SUMMARY_TONE;
  loading: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card transition hover:border-slate-300/70 hover:shadow-lifted">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
        {loading || value === null ? (
          <Skeleton className="mt-2 h-7 w-12" />
        ) : (
          <p className={`mt-2 text-[1.7rem] font-bold leading-none tabular-nums tracking-[-0.02em] ${SUMMARY_VALUE_TONE[tone]}`}>
            {value}
          </p>
        )}
      </div>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${SUMMARY_TONE[tone]}`}>
        {icon}
      </span>
    </div>
  );
}

function InventoryTableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, index) => (
        <tr key={index}>
          <td className="px-4 py-3.5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="mt-1.5 h-3 w-20" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-4 w-10" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-4 w-8" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-4 w-14" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-4 w-16" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="h-4 w-16" />
          </td>
          <td className="px-4 py-3.5">
            <Skeleton className="ml-auto h-4 w-24" />
          </td>
        </tr>
      ))}
    </>
  );
}

function pageNumbers(current: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const candidates = new Set<number>([1, 2, totalPages - 1, totalPages, current - 1, current, current + 1]);
  const sorted = Array.from(candidates)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const out: (number | '…')[] = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous !== 0 && page - previous > 1) out.push('…');
    out.push(page);
    previous = page;
  }
  return out;
}

function PaginationFooter({
  total,
  page,
  totalPages,
  onPageChange,
}: {
  total: number;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  if (totalPages <= 1) {
    return (
      <p className="text-xs text-slate-500">
        Showing {from}–{to} of {total} {total === 1 ? 'item' : 'items'}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-slate-500">
        Showing {from}–{to} of {total} items
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pageNumbers(page, totalPages).map((value, index) =>
          value === '…' ? (
            <span key={`ellipsis-${index}`} className="px-1.5 text-xs text-slate-400">
              …
            </span>
          ) : (
            <button
              key={value}
              type="button"
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                value === page
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
              onClick={() => onPageChange(value)}
              aria-label={`Page ${value}`}
              aria-current={value === page ? 'page' : undefined}
            >
              {value}
            </button>
          )
        )}
        <button
          type="button"
          className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export function InventoryPage() {
  const toast = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canManage = currentUser ? MANAGER_ROLES.includes(currentUser.role) : false;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [health, setHealth] = useState<StockHealth | ''>('');

  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItemProfile | null>(null);
  const [recordingOn, setRecordingOn] = useState<InventoryItemProfile | null>(null);
  const [recordingPreset, setRecordingPreset] = useState<{ type: InventoryTransactionType; quantity: string } | null>(
    null
  );
  const [viewingHistory, setViewingHistory] = useState<InventoryItemProfile | null>(null);
  const [toDelete, setToDelete] = useState<InventoryItemProfile | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, health, category]);

  const query: ListInventoryItemsQuery = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    category: category || undefined,
    health: health || undefined,
  };

  const { data, isError, isFetching, refetch } = useListInventoryItemQuery(query);
  const [deleteItem, { isLoading: deleting }] = useDeleteInventoryItemMutation();

  const summary = useMemo(() => {
    if (!data) return null;
    const counts = { inStock: 0, lowStock: 0, outOfStock: 0 };
    for (const item of data.items) {
      if (item.health === 'LOW_STOCK') counts.lowStock += 1;
      else if (item.health === 'OUT_OF_STOCK') counts.outOfStock += 1;
      else counts.inStock += 1;
    }
    return { total: data.total, ...counts };
  }, [data]);

  /** Unique categories present in the loaded result (plus the active filter),
   *  so the filter options never outlive the data the page already fetched. */
  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    if (category) seen.add(category);
    for (const item of data?.items ?? []) {
      if (item.category) seen.add(item.category);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b));
  }, [data, category]);

  const filtersActive = Boolean(debouncedSearch || category || health);

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

  function openCreate() {
    setEditingItem(null);
    setFormOpen(true);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Inventory"
        description="Track stock levels, costs, and inventory movements."
        actions={
          canManage && (
            <button type="button" className="btn-primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Add Item
            </button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryCard
          label="Total items"
          value={summary?.total ?? null}
          icon={<Package className="h-4 w-4" />}
          tone="slate"
          loading={isFetching && !data}
        />
        <SummaryCard
          label="In stock"
          value={summary?.inStock ?? null}
          icon={<CheckCircle2 className="h-4 w-4" />}
          tone="green"
          loading={isFetching && !data}
        />
        <SummaryCard
          label="Low stock"
          value={summary?.lowStock ?? null}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone="amber"
          loading={isFetching && !data}
        />
        <SummaryCard
          label="Out of stock"
          value={summary?.outOfStock ?? null}
          icon={<XCircle className="h-4 w-4" />}
          tone="red"
          loading={isFetching && !data}
        />
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-xs">
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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="sm:w-44">
            <select
              className="input"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              aria-label="Filter by category"
            >
              <option value="">All categories</option>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:w-44">
            <select
              className="input"
              value={health}
              onChange={(event) => setHealth(event.target.value as StockHealth | '')}
              aria-label="Filter by stock status"
            >
              <option value="">All stock levels</option>
              {(Object.keys(STOCK_HEALTH_LABELS) as StockHealth[]).map((state) => (
                <option key={state} value={state}>
                  {STOCK_HEALTH_LABELS[state]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <ReorderSuggestionsCard
        canManage={canManage}
        onRestock={(item, suggestedQuantity) => {
          setRecordingOn(item);
          setRecordingPreset({ type: 'PURCHASE', quantity: suggestedQuantity });
        }}
        onRetry={() => {
          void refetch();
        }}
      />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600">
              <XCircle className="h-5 w-5" />
            </span>
            <p className="text-sm text-slate-500">Could not load inventory.</p>
            <button type="button" className="btn-secondary" onClick={() => refetch()}>
              <RotateCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : (
          <div className="scroll-x rounded-t-xl">
            <table className="w-full min-w-[900px] text-left text-sm">
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
                  <InventoryTableSkeleton />
                ) : data && data.items.length > 0 ? (
                  data.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800">{item.name}</p>
                        {item.sku ? (
                          <p className="mt-0.5 font-mono text-xs text-slate-500">{item.sku}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-lg font-semibold leading-6 tabular-nums text-slate-800">
                          {item.quantity}
                        </p>
                        {!item.isActive && (
                          <p className="text-xs font-normal text-slate-400">inactive</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{STOCK_UNIT_LABELS[item.unit]}</td>
                      <td className="px-4 py-3.5 tabular-nums text-slate-600">
                        {formatMoney(item.costPrice)}{' '}
                        <span className="text-xs text-slate-400">/ {STOCK_UNIT_LABELS[item.unit]}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant={STOCK_HEALTH_BADGE[item.health]}>
                          {STOCK_HEALTH_LABELS[item.health]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        {item.category ? (
                          <span className="inline-flex items-center whitespace-nowrap rounded-md bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                            {item.category}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
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
                        title={filtersActive ? 'No items found' : 'No inventory items'}
                        description={
                          filtersActive
                            ? 'Try adjusting your search or filters.'
                            : 'Add your first inventory item to start tracking stock.'
                        }
                        action={
                          !filtersActive && canManage ? (
                            <button type="button" className="btn-secondary" onClick={openCreate}>
                              <Plus className="h-4 w-4" />
                              Add Item
                            </button>
                          ) : undefined
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
            <PaginationFooter
              total={data.total}
              page={data.page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
        {isFetching && data && (
          <div className="flex justify-center border-t border-slate-100 py-3">
            <Spinner className="h-4 w-4 text-slate-400" />
          </div>
        )}
      </section>

      <ItemFormModal open={formOpen} item={editingItem} onClose={() => setFormOpen(false)} />
      <TransactionModal
        open={recordingOn !== null}
        item={recordingOn}
        presetType={recordingPreset?.type}
        presetQuantity={recordingPreset?.quantity}
        onClose={() => {
          setRecordingOn(null);
          setRecordingPreset(null);
        }}
      />
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