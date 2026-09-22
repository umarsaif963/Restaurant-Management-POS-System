import { useMemo, useState } from 'react';
import {
  CookingPot,
  Minus,
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import type {
  CreateOrderInput,
  MenuItemProfile,
  OrderAddOnSnapshot,
  OrderType,
  RestaurantTableProfile,
} from '@restaurant/shared';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Badge } from '@/components/ui/Badge';
import { ItemPickModal, type PickedLine } from '@/components/orders/ItemPickModal';
import { useListTablesQuery } from '@/store/api/tableApi';
import { useListCustomersQuery } from '@/store/api/customerApi';
import { useCreateOrderMutation } from '@/store/api/orderApi';
import { useGetSettingsQuery } from '@/store/api/settingsApi';
import { useListCategoriesQuery, useListItemsQuery } from '@/store/api/menuApi';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/useToast';
import { ORDER_TYPE_BADGE, ORDER_TYPE_LABELS } from '@/constants/order';
import { percentOf } from '@/utils/money';

interface CartAddOn extends OrderAddOnSnapshot {
  id: string;
}

interface CartLine {
  key: string;
  menuItemId: string;
  name: string;
  basePrice: string;
  variationId?: string;
  variationName?: string | null;
  priceAdjustment: string;
  addOns: CartAddOn[];
  notes?: string;
  taxRate: string;
  quantity: number;
}

const ORDER_TYPES: OrderType[] = ['DINE_IN', 'TAKEAWAY', 'DELIVERY'];
const CATEGORY_PAGE_SIZE = 60;

export function POSPage() {
  const toast = useToast();

  const { data: settings } = useGetSettingsQuery();
  const { data: tables } = useListTablesQuery();
  const { data: categories } = useListCategoriesQuery();
  const { data: customers } = useListCustomersQuery({ limit: 50 });
  const [createOrder, { isLoading: placing }] = useCreateOrderMutation();

  const [orderType, setOrderType] = useState<OrderType>('DINE_IN');
  const [tableId, setTableId] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [picking, setPicking] = useState<MenuItemProfile | null>(null);

  const debouncedSearch = useDebounce(search, 250);

  const { data: items, isFetching } = useListItemsQuery({
    limit: CATEGORY_PAGE_SIZE,
    categoryId: categoryId || undefined,
    search: debouncedSearch || undefined,
    status: 'ACTIVE' as const,
  });

  const customerSearch = useDebounce(customerQuery, 250);
  const matches = useMemo(() => {
    const pool = customers?.items ?? [];
    if (!customerSearch.trim()) return pool.slice(0, 8);
    const needle = customerSearch.trim().toLowerCase();
    return pool
      .filter(
        (customer) =>
          customer.name.toLowerCase().includes(needle) ||
          (customer.phone ?? '').toLowerCase().includes(needle),
      )
      .slice(0, 8);
  }, [customers?.items, customerSearch]);

  const selectedTable = tables?.find((table) => table.id === tableId);
  const selectedCustomer = customers?.items.find((customer) => customer.id === customerId);

  const selectTable = (table: RestaurantTableProfile) => {
    setTableId((current) => (current === table.id ? null : table.id));
  };

  function addLine(picked: PickedLine) {
    const item = items?.items.find((candidate) => candidate.id === picked.menuItemId);
    if (!item) return;
    const variation = item.variations.find((candidate) => candidate.id === picked.variationId);
    const addOnIds = [...new Set(picked.addOnIds)];
    const addOns: CartAddOn[] = [];
    for (const id of addOnIds) {
      const addOn = item.addOns.find((candidate) => candidate.id === id);
      if (addOn) addOns.push({ id: addOn.id, name: addOn.name, price: addOn.price });
    }
    const notesValue = picked.notes?.trim() || '';

    const key = [
      item.id,
      picked.variationId ?? '',
      addOns.map((addOn) => addOn.id).sort().join(','),
      notesValue,
    ].join('::');

    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) =>
          line.key === key ? { ...line, quantity: line.quantity + picked.quantity } : line,
        );
      }
      return [
        ...current,
        {
          key,
          menuItemId: item.id,
          name: item.name,
          basePrice: item.price,
          variationId: picked.variationId,
          variationName: variation?.name ?? null,
          priceAdjustment: variation?.priceAdjustment ?? '0',
          addOns,
          notes: notesValue || undefined,
          taxRate: item.taxRate,
          quantity: picked.quantity,
        },
      ];
    });
    setPicking(null);
  }

  const changeQuantity = (key: string, delta: number) => {
    setCart((current) =>
      current
        .map((line) =>
          line.key === key ? { ...line, quantity: Math.max(1, line.quantity + delta) } : line,
        )
        .filter((line) => line.quantity >= 1),
    );
  };

  const removeLine = (key: string) => {
    setCart((current) => current.filter((line) => line.key !== key));
  };

  const clearCustomer = () => {
    setCustomerId(null);
    setCustomerQuery('');
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    for (const line of cart) {
      const unit =
        Math.round(parseFloat(line.basePrice) * 100) +
        Math.round(parseFloat(line.priceAdjustment) * 100) +
        line.addOns.reduce((sum, addOn) => sum + Math.round(parseFloat(addOn.price) * 100), 0);
      subtotal += unit * line.quantity;
      tax += percentOf(unit * line.quantity, line.taxRate);
    }
    const serviceChargePct = orderType === 'DINE_IN' ? settings?.settings.serviceChargePct ?? '0' : '0';
    const service = percentOf(subtotal, serviceChargePct);
    return { subtotal, tax, service, total: subtotal + tax + service };
  }, [cart, orderType, settings?.settings.serviceChargePct]);

  const hasTable = orderType !== 'DINE_IN' || tableId !== null;
  const canPlace = cart.length > 0 && hasTable && !placing;

  async function placeOrder() {
    if (!canPlace) {
      if (orderType === 'DINE_IN' && tableId === null) {
        toast.error('Select a table', 'Dine-in orders must be attached to a table.');
      }
      return;
    }
    const payload: CreateOrderInput = {
      orderType,
      tableId: orderType === 'DINE_IN' ? tableId : null,
      customerId,
      notes: notes.trim() || null,
      kitchenNotes: null,
      items: cart.map((line) => ({
        menuItemId: line.menuItemId,
        quantity: line.quantity,
        variationId: line.variationId,
        addOnIds: line.addOns.map((addOn) => addOn.id),
        notes: line.notes,
      })),
    };
    try {
      const created = await createOrder(payload).unwrap();
      toast.success('Order placed', `${created.orderNumber} is now ${created.status.toLowerCase()}.`);
      setCart([]);
      setNotes('');
      setTableId(null);
      setCustomerId(null);
    } catch (error) {
      toast.error('Could not place order', error instanceof Error ? error.message : 'Please try again.');
    }
  }

  const serviceChargePct = orderType === 'DINE_IN' ? settings?.settings.serviceChargePct ?? '0' : '0';

  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1 space-y-4">
        <Card>
          <div className="space-y-3">
            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Order type
              </h2>
              <div className="flex flex-wrap gap-2">
                {ORDER_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={orderType === type ? 'chip chip-active' : 'chip'}
                    onClick={() => setOrderType(type)}
                  >
                    {ORDER_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>

            {orderType === 'DINE_IN' && (
              <div>
                <h2 className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Table
                  <span className="font-normal normal-case text-slate-400">(tap to select)</span>
                </h2>
                {tables?.length ? (
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
                    {tables.map((table) => {
                      const busy = table.status === 'OCCUPIED';
                      const active = table.id === tableId;
                      return (
                        <button
                          key={table.id}
                          type="button"
                          disabled={busy}
                          className={[
                            'flex flex-col items-center rounded-lg border px-2 py-2 text-xs transition',
                            active
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : busy
                                ? 'cursor-not-allowed border-slate-200 bg-slate-50 text-slate-300'
                                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-700',
                          ].join(' ')}
                          onClick={() => selectTable(table)}
                          title={busy ? `${table.tableNumber} is in use` : `Table ${table.tableNumber}`}
                        >
                          <span className="font-semibold">{String(table.tableNumber).padStart(2, '0')}</span>
                          {busy && <span className="text-[10px] opacity-70">In use</span>}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">No tables configured yet.</p>
                )}
              </div>
            )}

            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Customer</h2>
              {selectedCustomer ? (
                <div className="flex items-center gap-2">
                  <Badge variant="slate">
                    <UserIcon className="mr-1 h-3 w-3" />
                    {selectedCustomer.name}
                    {selectedCustomer.phone ? ` (${selectedCustomer.phone})` : ''}
                  </Badge>
                  <button
                    type="button"
                    className="text-xs text-slate-400 underline transition hover:text-slate-600"
                    onClick={clearCustomer}
                  >
                    Clear
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="search"
                    className="input pl-9"
                    placeholder="Search customers…"
                    value={customerQuery}
                    onChange={(event) => {
                      setCustomerQuery(event.target.value);
                      setCustomerId(null);
                    }}
                    aria-label="Search customers"
                  />
                  {customerQuery.trim() !== '' && matches.length > 0 && (
                    <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
                      {matches.map((customer) => (
                        <li key={customer.id}>
                          <button
                            type="button"
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-brand-50"
                            onClick={() => {
                              setCustomerId(customer.id);
                              setCustomerQuery(customer.name);
                            }}
                          >
                            <span>{customer.name}</span>
                            {customer.phone && <span className="text-xs text-slate-400">{customer.phone}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Menu</h2>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={categoryId === '' ? 'chip chip-active' : 'chip'}
                    onClick={() => setCategoryId('')}
                  >
                    All
                  </button>
                  {(categories ?? []).map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className={categoryId === category.id ? 'chip chip-active' : 'chip'}
                      onClick={() => setCategoryId(category.id)}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
                <div className="relative w-full max-w-xs sm:ml-auto">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    className="input pl-9"
                    placeholder="Search menu…"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    aria-label="Search menu items"
                  />
                </div>
              </div>

              {isFetching && cart.length === 0 && picking === null ? (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Skeleton key={index} className="h-28" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                  {(items?.items ?? []).map((item) => {
                    const hasOptions = item.variations.length > 0 || item.addOns.length > 0;
                    if (!item.available) {
                      return (
                        <div
                          key={item.id}
                          className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm text-slate-300"
                        >
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs">Unavailable</p>
                        </div>
                      );
                    }
                    return (
                      <button
                        key={item.id}
                        type="button"
                        className="flex flex-col rounded-lg border border-slate-200 bg-white p-3 text-left text-sm transition hover:border-brand-300 hover:shadow-sm"
                        onClick={() => (hasOptions ? setPicking(item) : addLine({ menuItemId: item.id, quantity: 1, addOnIds: [] }))}
                      >
                        <p className="font-medium text-slate-800">{item.name}</p>
                        <p className="mt-1 text-brand-700">
                          ${item.price}
                          {hasOptions && <span className="ml-2 text-xs font-normal text-slate-400">Customize</span>}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
              {!isFetching && (items?.items.length ?? 0) === 0 && (
                <p className="py-8 text-center text-sm text-slate-400">No menu items match.</p>
              )}
            </div>
          </div>
        </Card>
      </div>

      <Card className="sticky top-20 w-full max-w-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <ShoppingCart className="h-4 w-4 text-brand-600" />
            Current order
          </h2>
          <Badge variant={ORDER_TYPE_BADGE[orderType]}>{ORDER_TYPE_LABELS[orderType]}</Badge>
        </div>

        {selectedTable && orderType === 'DINE_IN' && (
          <p className="mb-2 text-xs text-slate-500">
            Table <span className="font-semibold text-slate-700">{String(selectedTable.tableNumber).padStart(2, '0')}</span>
            {selectedTable.name ? ` · ${selectedTable.name}` : ''}
          </p>
        )}

        {cart.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <CookingPot className="h-8 w-8 text-slate-200" />
            <p className="text-sm text-slate-400">Tap menu items to build the order.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {cart.map((line) => {
              const unit =
                Math.round(parseFloat(line.basePrice) * 100) +
                Math.round(parseFloat(line.priceAdjustment) * 100) +
                line.addOns.reduce((sum, addOn) => sum + Math.round(parseFloat(addOn.price) * 100), 0);
              const lineTotal = unit * line.quantity;
              return (
                <li key={line.key} className="rounded-lg border border-slate-100 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800">
                      {line.quantity} × {line.name}
                    </p>
                    <p className="text-sm font-semibold text-slate-800">${(lineTotal / 100).toFixed(2)}</p>
                  </div>
                  {line.variationName && <p className="mt-0.5 text-xs text-slate-500">{line.variationName}</p>}
                  {line.addOns.length > 0 && (
                    <p className="mt-0.5 text-xs text-slate-500">
                      {line.addOns.map((addOn) => `${addOn.name} +$${addOn.price}`).join(', ')}
                    </p>
                  )}
                  {line.notes && <p className="mt-0.5 text-xs italic text-slate-400">“{line.notes}”</p>}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1"
                      disabled={line.quantity <= 1}
                      onClick={() => changeQuantity(line.key, -1)}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="btn-secondary px-2 py-1"
                      disabled={line.quantity >= 99}
                      onClick={() => changeQuantity(line.key, 1)}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      className="ml-auto rounded p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                      onClick={() => removeLine(line.key)}
                      aria-label={`Remove ${line.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {cart.length > 0 && (
          <>
            <div className="mt-4">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Notes</h2>
              <input
                type="text"
                className="input"
                placeholder="Order-level notes (optional)"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
              />
            </div>

            <div className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal</span>
                <span>${(totals.subtotal / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Tax</span>
                <span>${(totals.tax / 100).toFixed(2)}</span>
              </div>
              {Number(serviceChargePct) > 0 && orderType === 'DINE_IN' && (
                <div className="flex justify-between text-slate-500">
                  <span>Service charge ({serviceChargePct}%)</span>
                  <span>${(totals.service / 100).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 text-base font-semibold text-slate-800">
                <span>Total</span>
                <span>${(totals.total / 100).toFixed(2)}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-primary mt-4 w-full"
              disabled={!canPlace}
              onClick={placeOrder}
            >
              {placing ? 'Placing order…' : 'Place order'}
            </button>
          </>
        )}
      </Card>

      <ItemPickModal item={picking} onClose={() => setPicking(null)} onAdd={addLine} />
    </div>
  );
}