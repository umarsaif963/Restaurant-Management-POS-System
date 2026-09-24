import { useState } from 'react';
import { ClipboardList, Plus, Printer, Search, Trash2 } from 'lucide-react';
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
import { useListOrderPaymentsQuery, useRecordPaymentMutation, useRefundPaymentMutation } from '@/store/api/paymentApi';
import { useListCategoriesQuery, useListItemsQuery } from '@/store/api/menuApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { extractApiError } from '@/services/api';
import { PAYMENT_METHOD_ORDER, PAYMENT_METHOD_LABELS, PAYMENT_METHOD_BADGE } from '@/constants/payment';
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

  // payments (module 9)
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER'>('CASH');
  const [tendered, setTendered] = useState('');
  const [notes, setNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [showRefundInput, setShowRefundInput] = useState<string | null>(null);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundNotes, setRefundNotes] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const { data: payments, isFetching: paymentsFetching } = useListOrderPaymentsQuery(orderId ?? '', {
    skip: !orderId,
  });

  const [recordPayment] = useRecordPaymentMutation();
  const [refundPayment] = useRefundPaymentMutation();

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
      toast.error('Could not add item', extractApiError(error).message);
    }
  }

  async function handleRemove(itemId: string) {
    if (!order) return;
    try {
      const updated = await removeItem({ id: order.id, itemId }).unwrap();
      toast.success('Item removed', `${updated.orderNumber} was re-totaled.`);
    } catch (error) {
      toast.error('Could not remove item', extractApiError(error).message);
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
      toast.error('Could not update status', extractApiError(error).message);
    }
  }

  async function handleRecordPayment() {
    if (!order) return;
    setSubmittingPayment(true);
    try {
      // For cash, the entered "tendered" can exceed the balance — the server
      // applies only the balance and records the change. For card/bank, the
      // amount is applied exactly as entered (partial payments supported).
      const appliedAmount = method === 'CASH' && tendered ? tendered : amount;
      const body = { amount: appliedAmount, method, notes: notes || undefined };
      await recordPayment({ id: order.id, ...body }).unwrap();
      toast.success('Payment recorded', `${PAYMENT_METHOD_LABELS[method]} of ${body.amount} accepted.`);
      setAmount('');
      setTendered('');
      setNotes('');
      setShowPaymentHistory(true);
    } catch (error) {
      toast.error('Could not record payment', extractApiError(error).message);
    } finally {
      setSubmittingPayment(false);
    }
  }

  async function handleRefund(paymentId: string, paymentAmount: string) {
    if (!order) return;
    setSubmittingRefund(true);
    try {
      const body = { amount: refundAmount || paymentAmount, notes: refundNotes || undefined };
      await refundPayment({ id: order.id, paymentId, body }).unwrap();
      toast.success('Refund recorded', `$${Number(refundAmount || paymentAmount).toFixed(2)} refunded.`);
      setShowRefundInput(null);
      setRefundAmount('');
      setRefundNotes('');
    } catch (error) {
      toast.error('Could not process refund', extractApiError(error).message);
    } finally {
      setSubmittingRefund(false);
    }
  }

  const canRecordPayment = canOperate && order && order.status !== 'CANCELLED' && Number(order.balanceDue) > 0;
  const isManagerOrAdmin = currentUser ? ['ADMIN', 'MANAGER'].includes(currentUser.role) : false;

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
            <a
              href={`/print/receipt/${order.id}`}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary ml-auto px-3 py-1.5 text-xs"
              title="Open a printable customer receipt"
            >
              <Printer className="mr-1 h-3.5 w-3.5" />
              Print receipt
            </a>
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

          {/* ---- payments (module 9) ---- */}
          {canOperate && canRecordPayment && (
            <section className="space-y-3 border-t border-slate-100 pt-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Collect payment
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500">Amount ($)</label>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input"
                    placeholder={order.balanceDue}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500">Method</label>
                  <select
                    className="input"
                    value={method}
                    onChange={(e) => setMethod(e.target.value as 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'OTHER')}
                  >
                    {PAYMENT_METHOD_ORDER.map((m) => (
                      <option key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {method === 'CASH' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-500">Cash tendered ($)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="input"
                      placeholder={order.balanceDue}
                      value={tendered}
                      onChange={(e) => setTendered(e.target.value)}
                    />
                  </div>
                  {tendered && Number(tendered) > Number(amount || order.balanceDue) && (
                    <div className="flex items-center text-sm text-green-700">
                      Change due: ${(Number(tendered) - Number(amount || order.balanceDue)).toFixed(2)}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label className="block text-xs text-slate-500">Notes</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Optional"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button
                type="button"
                disabled={submittingPayment || !amount}
                className="btn-primary"
                onClick={handleRecordPayment}
              >
                {submittingPayment ? 'Recording…' : `Record ${PAYMENT_METHOD_LABELS[method]} payment`}
              </button>
            </section>
          )}

          {/* payment history */}
          {order && (
            <section className="space-y-2 border-t border-slate-100 pt-4">
              <button
                type="button"
                className="btn-secondary w-full text-left"
                onClick={() => setShowPaymentHistory((v) => !v)}
              >
                {showPaymentHistory ? 'Hide' : 'Show'} payment history ({payments?.length ?? 0})
              </button>
              {showPaymentHistory && (
                <div className="space-y-2">
                  {paymentsFetching ? (
                    <Spinner />
                  ) : !payments?.length ? (
                    <p className="text-sm text-slate-400">No payments recorded yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {payments.map((p) => (
                        <li key={p.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2 text-sm">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant={PAYMENT_METHOD_BADGE[p.method]}>
                                {PAYMENT_METHOD_LABELS[p.method]}
                              </Badge>
                              <span className="font-semibold text-slate-800">${p.amount}</span>
                              {p.isRefund && (
                                <Badge variant="red">Refund of {p.refundOfId?.slice(0, 8)}</Badge>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">
                              {p.receivedByName ?? '—'} · {new Date(p.paidAt).toLocaleTimeString()}
                            </div>
                            {p.changeDue ? (
                              <div className="text-xs text-green-700">Change ${p.changeDue}</div>
                            ) : null}
                          </div>
                          {!p.isRefund && isManagerOrAdmin && (
                            <div className="shrink-0">
                              {showRefundInput === p.id ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    type="text"
                                    inputMode="decimal"
                                    className="input w-20"
                                    placeholder={p.amount}
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                  />
                                  <button
                                    type="button"
                                    className="btn-danger px-2 py-1 text-xs"
                                    disabled={submittingRefund}
                                    onClick={() => handleRefund(p.id, p.amount)}
                                  >
                                    {submittingRefund ? '…' : 'Refund'}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn-secondary px-2 py-1 text-xs"
                                    onClick={() => {
                                      setShowRefundInput(null);
                                      setRefundAmount('');
                                      setRefundNotes('');
                                    }}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  className="btn-danger px-2 py-1 text-xs"
                                  onClick={() => {
                                    setShowRefundInput(p.id);
                                    setRefundAmount('');
                                    setRefundNotes('');
                                  }}
                                >
                                  Refund
                                </button>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          )}

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