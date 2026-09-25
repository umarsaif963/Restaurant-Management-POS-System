import { CheckCircle2, RefreshCw, ShoppingCart } from 'lucide-react';
import type { InventoryItemProfile, ReorderSuggestionItem } from '@restaurant/shared';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
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
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Reorder suggestions</h2>
          <p className="text-xs text-slate-500">
            Flagged low/out-of-stock items with suggested purchase quantities from your last {WINDOW_DAYS} days of
            consumption.
          </p>
        </div>
        {suggestions.length > 0 && (
          <Badge variant="amber">
            {suggestions.length} {suggestions.length === 1 ? 'item' : 'items'} to restock
          </Badge>
        )}
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
          <p className="text-sm text-slate-500">Could not compute reorder suggestions.</p>
          <button type="button" className="btn-secondary" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : isFetching && !data ? (
        <div className="space-y-2 px-4 py-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-5 w-full" />
          ))}
        </div>
      ) : suggestions.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="h-6 w-6" />}
          title="All stock levels healthy"
          description="No items are currently below their minimum — check back after a few days of sales."
        />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">On hand</th>
                <th className="px-4 py-3 font-semibold">Health</th>
                <th className="px-4 py-3 font-semibold">Used / day</th>
                <th className="px-4 py-3 font-semibold">Days left</th>
                <th className="px-4 py-3 font-semibold">Suggested to order</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {suggestions.map((suggestion: ReorderSuggestionItem) => {
                const item = suggestion.item;
                return (
                  <tr key={item.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{item.name}</p>
                      {item.category && <p className="text-xs text-slate-500">{item.category}</p>}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-700">
                      {item.quantity}
                      <span className="ml-1 text-xs font-normal text-slate-400">{STOCK_UNIT_LABELS[item.unit]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={STOCK_HEALTH_BADGE[item.health]}>{STOCK_HEALTH_LABELS[item.health]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{suggestion.consumptionPerDay}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {suggestion.daysOfStock === '0' ? (
                        <span className="font-medium text-red-600">out of stock</span>
                      ) : (
                        suggestion.daysOfStock ?? '—'
                      )}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{suggestion.suggestedQuantity ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        {canManage && (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => onRestock(item, suggestion.suggestedQuantity ?? '')}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Restock
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
