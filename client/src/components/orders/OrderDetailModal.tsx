import { useState } from 'react';
import { ClipboardList, Plus, Search, Trash2 } from 'lucide-react';
import type { MenuItemProfile, OrderStatus } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ItemPickModal, type PickedLine } from '@/components/orders/ItemPickModal';
import {
  useAddOrderItemsMutation,
  useGetOrderQuery,
  useRemoveOrderItemMutation,
  useUpdateOrderStatusMutation,
} from '@/store/api/orderApi';
import { useListCategoriesQuery, useListItemsQuery } from '@/store/api/menuApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES_ALLOW_ITEM_EDITS,
  ORDER_TYPE_BADGE,
  ORDER_TYPE_LABELS,
  PAYMENT_STATUS_BADGE,
  PAYMENT_STATUS_LABELS,
} from '@/constants/order';

const STATUS_NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'COMPLETED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'COMPLETED', 'CANCELLED'],
  PREPARING: ['READY'],
  READY: ['SERVED'],
  SERVED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

const FRONT_OF_HOUSE = ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'];

interface OrderDetailModalProps {
  orderId: string | null;
  onClose: () => void;
}

export function OrderDetailModal({ orderId, onClose }: OrderDetailModalProps) {
  const toast = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canOperate = currentUser ? FRONT_OF_HOUSE.includes(currentUser.role) : false;

  const { data: order, isFetching } = useGetOrderQuery(orderId ?? '', { skip: !orderId });
  const { data: categories } = useListCategoriesQuery(undefined, { skip: !orderId });

  const [menuOpen, setMenuOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [search, setSearch] = useState('');
  const [picking, setPicking] = useState<MenuItemProfile | null>(null);
  const [cancelArmed, setCancelArmed] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const debouncedSearch = useDebounce(search, 250);
  const { data: items } = useListItemsQuery(
    {
      limit: 60,
      categoryId: categoryId || undefined,
      search: debouncedSearch || undefined,
      status: 'ACTIVE' as const,
    },
    { skip: !orderId },
  );

  const [addItems, { isLoading: adding }] = useAddOrderItemsMutation();
  const [removeItem, { isLoading: removing }] = useRemoveOrderItemMutation();
  const [updateStatus, { isLoading: updatingStatus }] = useUpdateOrderStatusMutation();

  const canEditItems =
    canOperate && order ? (ORDER_STATUSES_ALLOW_ITEM_EDITS as readonly string[]).includes(order.status) : false;

  async function handleAddLine(picked: PickedLine) {
    if (!order) return;
    try {
      const updated = await addItems({
        id: order.id,
        data: { items: [{ ...picked }] },
      }).unwrap();
      toast.success('Item added', `${updated.orderNumber} now has ${updated.items.length} line items.`);
      setPicking(null);
      setMenuOpen(false);
      setSearch('');
      setCategoryId('');
    } catch (error) {
      toast.error('Could not add item', error instanceof Error ? error.message : 'The order may no longer be editable.');
    }
  }

  async function handleRemove(itemId: string) {
    if (!order) return;
    try {
      const updated = await removeItem({ id: order.id, itemId }).unwrap();
      toast.success('Item removed', `${updated.orderNumber} was re-totaled.`);
    } catch (error) {
      toast.error('Could not remove item', error instanceof Error ? error.message : 'The order may no longer be editable.');
    }
  }

  async function handleStatus(next: OrderStatus) {
    if (!order) return;
    if (next === 'CANCELLED' && !cancelReason.trim()) {
      setCancelArmed(true);
      return;
    }
    try {
      await updateStatus({
        id: order.id,
        data: next === 'CANCELLED' ? { status: next, cancelledReason: cancelReason.trim() } : { status: next },
      }).unwrap();
      toast.success(
        'Order updated',
        `Order ${order.orderNumber} is now ${ORDER_STATUS_LABELS[next].toLowerCase()}.`,
      );
      setCancelArmed(false);
      setCancelReason('');
    } catch (error) {
      toast.error('Could not update status', error instanceof Error ? error.message : 'The transition was rejected.');
    }
  }

  return (
    <Modal open={orderId !== null} title={order ? `Order ${order.orderNumber}` : 'Order'} onClose={onClose} maxWidthClass="max-w-3xl">
      {!order ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <div className="space-y-5">
          {isFetching && <p className="text-xs text-slate-400">Refreshing…</p>}

          <div className="flex flex-wrap gap-2">
            <Badge variant={ORDER_TYPE_BADGE[order.orderType]}>
              {ORDER_TYPE_LABELS[order.orderType]}
            </Badge>
            <Badge variant={ORDER_STATUS_BADGE[order.status]}>{ORDER_STATUS_LABELS[order.status]}</Badge>
            <Badge variant={PAYMENT_STATUS_BADGE[order.paymentStatus]}>
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </Badge>
            {order.cancelledReason && (
              <Badge variant="red">Cancelled: {order.cancelledReason}</Badge>
            )}
          </div>

          <section className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Seat</p>
              <p className="text-slate-800">
                {order.orderType === 'DINE_IN' && order.tableNumber !== null
                  ? `Table ${String(order.tableNumber).padStart(2, '0')}`
                  : '—'}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Customer</p>
              <p className="text-slate-800">{order.customerName ?? 'Walk-in'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Taken by</p>
              <p className="text-slate-800">{order.userName}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Created</p>
              <p className="text-slate-800">
                {new Date(order.createdAt).toLocaleString(undefined, {
                  month: 'short',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            {order.completedAt && (
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">Completed</p>
                <p className="text-slate-800">
                  {new Date(order.completedAt).toLocaleString(undefined, {
                    month: 'short',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )}
            {order.notes && (
              <div className="col-span-3">
                <p className="text-xs uppercase tracking-wider text-slate-400">Notes</p>
                <p className="text-sm italic text-slate-600">“{order.notes}”</p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">Items</h3>
              {canEditItems && !menuOpen && (
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => setMenuOpen(true)}
                >
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add items
                </button>
              )}
            </div>

            {menuOpen && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 flex flex-wrap items-center gap-2">
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
                  <div className="relative ml-auto w-full max-w-[220px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      className="input pl-8 py-1.5 text-sm"
                      placeholder="Search…"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      aria-label="Search menu items"
                    />
                  </div>
                </div>
                <div className="grid max-h-56 grid-cols-2 gap-2 overflow-y-auto md:grid-cols-3">
                  {(items?.items ?? []).map((item) => {
                    const hasOptions = item.variations.length > 0 || item.addOns.length > 0;
                    if (!item.available) {
                      return (
                        <div key={item.id} className="rounded-lg border border-slate-100 bg-white p-2 text-xs text-slate-300">
                          {item.name}
                        </div>
                      );
                    }
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={adding}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-2 text-left text-xs transition hover:border-brand-300"
                        onClick={() =>
                          hasOptions
                            ? setPicking(item)
                            : handleAddLine({ menuItemId: item.id, quantity: 1, addOnIds: [] })
                        }
                      >
                        <span className="font-medium text-slate-700">{item.name}</span>
                        <span className="shrink-0 text-brand-700">${item.price}</span>
                      </button>
                    );
                  })}
                </div>
                {(items?.items.length ?? 0) === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">No items match.</p>
                )}
              </div>
            )}

            {order.items.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-400">No items yet.</p>
            ) : (
              <ul className="space-y-2">
                {order.items.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">
                        {item.quantity} × {item.name}
                      </p>
                      {item.variationName && <p className="text-xs text-slate-500">{item.variationName}</p>}
                      {item.addOns && item.addOns.length > 0 && (
                        <p className="text-xs text-slate-500">
                          {item.addOns.map((addOn) => `${addOn.name} +$${addOn.price}`).join(', ')}
                        </p>
                      )}
                      {item.notes && <p className="text-xs italic text-slate-400">“{item.notes}”</p>}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <p className="text-sm font-semibold text-slate-800">${item.lineTotal}</p>
                      {canEditItems && (
                        <button
                          type="button"
                          disabled={removing}
                          className="rounded p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleRemove(item.id)}
                          aria-label={`Remove ${item.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-1 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between text-slate-500">
              <span>Subtotal</span>
              <span>${order.subtotal}</span>
            </div>
            {Number(order.itemDiscountTotal) !== 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Item discounts</span>
                <span>${order.itemDiscountTotal}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500">
              <span>Tax</span>
              <span>${order.taxAmount}</span>
            </div>
            {Number(order.serviceChargeAmount) !== 0 && (
              <div className="flex justify-between text-slate-500">
                <span>Service charge</span>
                <span>${order.serviceChargeAmount}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 text-base font-semibold text-slate-800">
              <span>Total</span>
              <span>${order.grandTotal}</span>
            </div>
            {Number(order.balanceDue) !== 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Balance due</span>
                <span>${order.balanceDue}</span>
              </div>
            )}
          </section>

          {canOperate && !cancelArmed && (
            <section className="border-t border-slate-100 pt-3">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Advance order</h3>
              <div className="flex flex-wrap gap-2">
                {STATUS_NEXT[order.status].map((next) => (
                  <button
                    key={next}
                    type="button"
                    disabled={updatingStatus}
                    className={next === 'CANCELLED' ? 'btn-danger' : 'btn-primary'}
                    onClick={() => handleStatus(next)}
                  >
                    Mark {ORDER_STATUS_LABELS[next]}
                  </button>
                ))}
                {STATUS_NEXT[order.status].length === 0 && (
                  <p className="flex items-center gap-2 text-xs text-slate-400">
                    <ClipboardList className="h-4 w-4" />
                    This order is closed.
                  </p>
                )}
              </div>
            </section>
          )}

          {cancelArmed && (
            <section className="rounded-xl border border-red-200 bg-red-50 p-3">
              <h3 className="mb-2 text-sm font-semibold text-red-800">Cancel order {order.orderNumber}?</h3>
              <input
                type="text"
                className="input"
                placeholder="Required — tell the kitchen why"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                maxLength={500}
                autoFocus
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  disabled={updatingStatus}
                  className="btn-danger"
                  onClick={() => handleStatus('CANCELLED')}
                >
                  Confirm cancellation
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setCancelArmed(false)}
                >
                  Keep open
                </button>
              </div>
            </section>
          )}
        </div>
      )}

      <ItemPickModal item={picking} onClose={() => setPicking(null)} onAdd={handleAddLine} />
    </Modal>
  );
}