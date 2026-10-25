import { CheckCircle2, RefreshCw, ShoppingCart } from 'lucide-react';
import type { InventoryItemProfile, ReorderSuggestionItem } from '@restaurant/shared';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { STOCK_HEALTH_BADGE, STOCK_HEALTH_LABELS, STOCK_UNIT_LABELS } from '@/constants/inventory';
import { useGetReorderSuggestionsQuery } from '@/store/api/inventoryApi';

const WINDOW_DAYS = 14;
const LEAD_DAYS = 7;

interface ReorderSuggestionsCardProps {
  canManage: boolean;
  onRestock: (item: InventoryItemProfile, suggestedQuantity: string) => void;
  onRetry: () => void;
}

export function ReorderSuggestionsCard({ canManage, onRestock, onRetry }: ReorderSuggestionsCardProps) {
  const { data, isFetching, isError } = useGetReorderSuggestionsQuery({ windowDays: WINDOW_DAYS, leadDays: LEAD_DAYS });
  const suggestions = data?.items ?? [];

  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold tracking-tight text-slate-800">Reorder suggestions</h2>
          {suggestions.length > 0 && <Badge variant="amber">{suggestions.length} to restock</Badge>}
        </div>
        <p className="hidden text-xs text-slate-500 md:block">
          Consumption over the last {WINDOW_DAYS} days
        </p>
      </header>

      {isError ? (
        <div className="flex items-center gap-3 px-4 py-5">
          <p className="text-sm text-slate-500">Could not compute reorder suggestions.</p>
          <button type="button" className="btn-secondary ml-auto" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : isFetching && !data ? (
        <div className="space-y-2 px-4 py-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="ml-auto h-4 w-10" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <div className="flex items-center gap-3 px-4 py-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-medium text-slate-700">All stock levels are healthy</p>
            <p className="text-xs text-slate-500">No items are currently below their minimum stock level.</p>
          </div>
        </div>
      ) : (
        <ul className="flex flex-col">
          {suggestions.map((suggestion: ReorderSuggestionItem) => {
            const item = suggestion.item;
            return (
              <li
                key={item.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-slate-50 px-4 py-3 last:border-0 hover:bg-slate-50/70"
              >
                <div className="min-w-0 flex-1 basis-36">
                  <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                  {item.category && <p className="truncate text-xs text-slate-500">{item.category}</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums text-slate-700">
                    {item.quantity}
                    <span className="ml-0.5 text-xs font-normal text-slate-400">
                      {STOCK_UNIT_LABELS[item.unit]}
                    </span>
                  </p>
                  <p
                    className={
                      suggestion.daysOfStock === '0'
                        ? 'text-xs font-medium text-red-600'
                        : 'text-xs text-slate-400'
                    }
                  >
                    {suggestion.daysOfStock === null ? '—' : suggestion.daysOfStock === '0' ? 'out of stock' : `${suggestion.daysOfStock}d left`}
                  </p>
                </div>
                <Badge variant={STOCK_HEALTH_BADGE[item.health]}>
                  {STOCK_HEALTH_LABELS[item.health]}
                </Badge>
                <div className="text-right">
                  <p className="text-xs text-slate-400">Suggested</p>
                  <p className="text-sm font-semibold tabular-nums text-slate-800">
                    {suggestion.suggestedQuantity ?? '—'}
                  </p>
                </div>
                {canManage && (
                  <button
                    type="button"
                    className="btn-secondary px-3 py-1.5 text-xs"
                    onClick={() => onRestock(item, suggestion.suggestedQuantity ?? '')}
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Restock
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}