import { type ReactNode } from 'react';
import {
  Bell,
  ChefHat,
  CreditCard,
  LayoutDashboard,
  Search,
  ShoppingCart,
  Wifi,
} from 'lucide-react';
import {
  SAMPLE_CATEGORIES,
  SAMPLE_DISHES,
  SAMPLE_PAYMENT_MIX,
  SAMPLE_SALES_BARS,
  SAMPLE_TICKETS,
  SAMPLE_TOP_DISHES,
  SAMPLE_STATS,
  SAMPLE_TICKET_TOTAL,
  SAMPLE_VENUE,
} from './sampleData';

/**
 * Illustrative product previews. These are hand-built mock-ups of the real
 * workspace screens (POS, kitchen display, reports) reusing the same colours,
 * density and terminology as the application - not screenshots, so they can
 * never drift out of date or leak real data.
 */

// ---------------------------------------------------------------------------
// Frame
// ---------------------------------------------------------------------------

interface PreviewFrameProps {
  title?: string;
  address?: string;
  children: ReactNode;
  /** Compact chrome for smaller embedded previews. */
  compact?: boolean;
  className?: string;
}

/** Browser-style chrome that stages a preview like a real product window. */
export function PreviewFrame({
  title = 'Restaurant POS',
  address = 'app.restaurant-pos.example',
  children,
  compact = false,
  className = '',
}: PreviewFrameProps) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-stage ring-1 ring-slate-900/5 ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-slate-100 bg-bone-50 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>
        <div className="hidden min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1 text-[11px] text-slate-400 ring-1 ring-slate-200/70 sm:flex">
          <Wifi className="h-3 w-3 text-brand-500" />
          <span className="truncate">{address}</span>
        </div>
        <p className="ml-auto truncate text-[11px] font-medium text-slate-400">{title}</p>
      </div>
      <div className={compact ? 'bg-white' : 'bg-slate-50/60'}>{children}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// POS preview
// ---------------------------------------------------------------------------

/** Counter screen: category rail, dish grid, open ticket with totals. */
export function PosPreview({ className = '' }: { className?: string }) {
  const activeDishes = SAMPLE_DISHES.slice(0, 8);

  return (
    <PreviewFrame title="Point of sale" className={className}>
      <div className="flex flex-col lg:flex-row">
        {/* Dish grid */}
        <div className="min-w-0 flex-1 p-3 sm:p-4">
          <div className="flex items-center gap-2">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-400">
              <Search className="h-3.5 w-3.5" />
              <span className="truncate">Search the menu&hellip;</span>
            </div>
            <div className="flex gap-1.5">
              {SAMPLE_CATEGORIES.map((category, index) => (
                <span
                  key={category}
                  className={`hidden rounded-md px-2 py-1 text-[11px] font-medium sm:inline-flex ${
                    index === 1
                      ? 'bg-brand-600 text-white shadow-sm'
                      : 'bg-white text-slate-500 ring-1 ring-slate-200'
                  }`}
                >
                  {category}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
            {activeDishes.map((dish, index) => (
              <button
                key={dish.name}
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                className={`group rounded-xl border bg-white p-2.5 text-left transition ${
                  index === 1 || index === 5
                    ? 'border-brand-300 ring-2 ring-brand-500/20'
                    : 'border-slate-200/80 hover:border-brand-300'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-full items-center justify-center rounded-lg bg-gradient-to-br from-bone-100 to-bone-200 font-display text-sm font-bold text-bone-400"
                >
                  {dish.name.charAt(0)}
                </span>
                <span className="mt-2 block truncate text-xs font-semibold text-slate-800">
                  {dish.name}
                </span>
                <span className="mt-0.5 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{dish.note}</span>
                  <span className="font-semibold text-brand-700">${dish.price.toFixed(2)}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Ticket */}
        <div className="border-t border-slate-100 bg-white p-3 sm:p-4 lg:w-64 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Open ticket
            </p>
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500">
              Dine-in
            </span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-800">
            Table 3 &middot; #1043
          </p>

          <ul className="mt-3 space-y-2">
            {SAMPLE_TICKETS[1].lines.map((line) => (
              <li key={line.name} className="flex items-start justify-between gap-2 text-xs">
                <span className="min-w-0 text-slate-600">
                  <span className="mr-1.5 font-semibold text-slate-800">{line.qty}&times;</span>
                  <span className="break-words">{line.name}</span>
                </span>
                <span className="shrink-0 font-medium text-slate-800">
                  ${(line.qty * line.price).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 space-y-1 border-t border-dashed border-slate-200 pt-3 text-xs">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>${SAMPLE_TICKET_TOTAL.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Service 10%</span>
              <span>${(SAMPLE_TICKET_TOTAL * 0.1).toFixed(2)}</span>
            </div>
            <div className="flex justify-between pt-1 text-sm font-bold text-slate-900">
              <span>Total</span>
              <span>${(SAMPLE_TICKET_TOTAL * 1.1).toFixed(2)}</span>
            </div>
          </div>

          <div
            aria-hidden="true"
            className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-brand-600 py-2 text-xs font-semibold text-white shadow-sm"
          >
            <CreditCard className="h-3.5 w-3.5" />
            Take payment
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

// ---------------------------------------------------------------------------
// Kitchen display preview
// ---------------------------------------------------------------------------

const STATUS_STYLES: Record<string, string> = {
  Cooking: 'bg-amber-100 text-amber-700',
  Ready: 'bg-brand-100 text-brand-700',
  Served: 'bg-slate-100 text-slate-500',
};

/** KDS ticket board with elapsed timers. */
export function KdsPreview({ className = '' }: { className?: string }) {
  return (
    <PreviewFrame title="Kitchen display" className={className}>
      <div className="bg-ink-950 p-3 sm:p-4">
        <div className="flex items-center justify-between px-1 pb-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Kitchen &middot; Evening service
          </p>
          <p className="flex items-center gap-1.5 text-[11px] text-brand-400">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
            Live
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {SAMPLE_TICKETS.map((ticket) => (
            <div
              key={ticket.id}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-lg"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-white">{ticket.id}</p>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${STATUS_STYLES[ticket.status]}`}
                >
                  {ticket.status}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] text-slate-400">
                {ticket.table} &middot; {ticket.server}
              </p>

              <ul className="mt-2.5 space-y-1.5">
                {ticket.lines.map((line) => (
                  <li
                    key={line.name}
                    className="flex items-baseline justify-between gap-2 text-xs text-slate-200"
                  >
                    <span className="min-w-0">
                      <span className="mr-1.5 font-bold text-white">{line.qty}&times;</span>
                      {line.name}
                    </span>
                  </li>
                ))}
              </ul>

              <p
                className={`mt-3 flex items-center gap-1.5 border-t border-white/10 pt-2 text-[11px] font-semibold ${
                  ticket.minutes >= 9 ? 'text-ember-400' : 'text-slate-400'
                }`}
              >
                <ChefHat className="h-3 w-3" />
                {ticket.minutes} min elapsed
              </p>
            </div>
          ))}
        </div>
      </div>
    </PreviewFrame>
  );
}

// ---------------------------------------------------------------------------
// Reports preview
// ---------------------------------------------------------------------------

/** Dashboard/reporting screen: stat row, hourly chart, top dishes, payment mix. */
export function ReportsPreview({ className = '' }: { className?: string }) {
  return (
    <PreviewFrame title="Reports" className={className}>
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between px-1">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
            <LayoutDashboard className="h-3.5 w-3.5 text-brand-600" />
            Today at {SAMPLE_VENUE}
          </p>
          <span className="rounded-md bg-white px-2 py-1 text-[10px] font-medium text-slate-400 ring-1 ring-slate-200">
            All channels
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {SAMPLE_STATS.map((stat) => (
            <div key={stat.label} className="rounded-xl border border-slate-200/70 bg-white p-2.5">
              <p className="truncate text-[10px] font-medium uppercase tracking-wide text-slate-400">
                {stat.label}
              </p>
              <p className="mt-1 text-sm font-bold tracking-tight text-slate-900">{stat.value}</p>
              <p className="text-[10px] font-semibold text-brand-600">{stat.delta}</p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {/* Hourly bars */}
          <div className="rounded-xl border border-slate-200/70 bg-white p-3 lg:col-span-2">
            <p className="text-[11px] font-semibold text-slate-600">Sales by hour</p>
            <div className="mt-3 flex h-24 items-end gap-1.5">
              {SAMPLE_SALES_BARS.map((bar) => (
                <div key={bar.hour} className="group flex flex-1 flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t-sm transition-all ${
                      bar.value >= 88
                        ? 'bg-brand-500'
                        : 'bg-brand-500/30 group-hover:bg-brand-500/60'
                    }`}
                    style={{ height: `${bar.value}%` }}
                  />
                  <span className="text-[8px] text-slate-400">{bar.hour}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top dishes + payments */}
          <div className="space-y-3">
            <div className="rounded-xl border border-slate-200/70 bg-white p-3">
              <p className="text-[11px] font-semibold text-slate-600">Best sellers</p>
              <ul className="mt-2 space-y-1.5">
                {SAMPLE_TOP_DISHES.map((dish) => (
                  <li key={dish.name} className="flex items-center justify-between gap-2 text-[11px]">
                    <span className="min-w-0 truncate text-slate-600">{dish.name}</span>
                    <span className="shrink-0 font-semibold text-slate-800">{dish.orders}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-200/70 bg-white p-3">
              <p className="text-[11px] font-semibold text-slate-600">Payment mix</p>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full bg-slate-100">
                <span className="bg-brand-500" style={{ width: `${SAMPLE_PAYMENT_MIX[0].share}%` }} />
                <span className="bg-ember-400" style={{ width: `${SAMPLE_PAYMENT_MIX[1].share}%` }} />
                <span className="bg-slate-300" style={{ width: `${SAMPLE_PAYMENT_MIX[2].share}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {SAMPLE_PAYMENT_MIX.map((method, index) => (
                  <span key={method.label} className="flex items-center gap-1 text-[10px] text-slate-500">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        index === 0 ? 'bg-brand-500' : index === 1 ? 'bg-ember-400' : 'bg-slate-300'
                      }`}
                    />
                    {method.label} {method.share}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}

// ---------------------------------------------------------------------------
// Small floating widgets
// ---------------------------------------------------------------------------

/** One compact floating card for layered hero compositions. */
export function StatChip({
  icon,
  label,
  value,
  className = '',
}: {
  icon: ReactNode;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-pop backdrop-blur ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="truncate text-sm font-bold tracking-tight text-slate-900">{value}</p>
      </div>
    </div>
  );
}

/** "New order routed to kitchen" toast used in the hero composition. */
export function OrderToast({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-pop backdrop-blur ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white shadow-brand-glow">
        <Bell className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-bold text-slate-900">Order #1044 sent to kitchen</p>
        <p className="truncate text-[11px] text-slate-500">
          Pickup &middot; 2 items &middot; just now
        </p>
      </div>
    </div>
  );
}

/** Cart/orders counter chip for hero layering. */
export function CartChip({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-pop backdrop-blur ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink-950 text-white">
        <ShoppingCart className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Open orders
        </p>
        <p className="truncate text-sm font-bold tracking-tight text-slate-900">3 running</p>
      </div>
    </div>
  );
}
