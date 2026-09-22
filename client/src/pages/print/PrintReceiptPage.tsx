import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useGetReceiptQuery } from '@/store/api/orderApi';
import { Spinner } from '@/components/ui/Spinner';

function money(value: string | number): string {
  const amount = typeof value === 'string' ? parseFloat(value) : value;
  return `${amount < 0 ? '-' : ''}$${Math.abs(amount).toFixed(2)}`;
}

const META_LABELS = {
  orderNumber: 'Order',
  seatedAt: 'Date',
  takenBy: 'Server',
  customer: 'Customer',
  table: 'Table',
} as const;

export function PrintReceiptPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();
  const [printed, setPrinted] = useState(false);

  const { data: receipt, isError, error } = useGetReceiptQuery(orderId ?? '', { skip: !orderId });

  useEffect(() => {
    if (receipt && !printed) {
      setPrinted(true);
      const timer = window.setTimeout(() => window.print(), 150);
      return () => window.clearTimeout(timer);
    }
  }, [receipt, printed]);

  if (isError || (!receipt && !orderId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm font-medium text-red-700">
            {error instanceof Error ? error.message : 'Receipt could not be loaded.'}
          </p>
          <button type="button" className="btn-secondary mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 text-slate-400" />
      </div>
    );
  }

  const order = receipt.order;
  const showTax = receipt.showTaxOnReceipt && Number(order.taxAmount) !== 0;
  const showServiceCharge = receipt.showServiceChargeOnReceipt && Number(order.serviceChargeAmount) !== 0;

  return (
    <div className="min-h-screen bg-slate-200 py-8">
      <div className="mx-auto max-w-md px-4">
        <div className="no-print mb-4 flex items-center justify-between">
          <button type="button" className="btn-secondary" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </button>
          <button type="button" className="btn-primary" onClick={() => window.print()}>
            <Printer className="mr-1 h-4 w-4" />
            Print
          </button>
        </div>

        <div className="print-area rounded-xl border border-slate-300 bg-white p-6 font-mono">
          <header className="border-b-2 border-dashed border-slate-300 pb-4 text-center">
            <h1 className="text-lg font-bold uppercase tracking-wide text-slate-900">{receipt.restaurantName}</h1>
            {receipt.restaurantAddress && <p className="text-sm text-slate-700">{receipt.restaurantAddress}</p>}
            {receipt.restaurantPhone && <p className="text-sm text-slate-700">{receipt.restaurantPhone}</p>}
            {receipt.restaurantEmail && <p className="text-sm text-slate-700">{receipt.restaurantEmail}</p>}
            {receipt.receiptHeader && (
              <p className="mt-2 text-xs text-slate-500">{receipt.receiptHeader}</p>
            )}
          </header>

          <section className="border-b border-dashed border-slate-300 py-3 text-xs text-slate-700">
            <div className="flex justify-between">
              <span>{META_LABELS.orderNumber}</span>
              <span className="font-semibold">{order.orderNumber}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>{META_LABELS.seatedAt}</span>
              <span>
                {new Date(order.completedAt ?? order.createdAt).toLocaleString(undefined, {
                  month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            <div className="mt-1 flex justify-between">
              <span>{META_LABELS.takenBy}</span>
              <span>{order.userName}</span>
            </div>
            {order.orderType === 'DINE_IN' && order.tableNumber !== null && (
              <div className="mt-1 flex justify-between">
                <span>{META_LABELS.table}</span>
                <span>{String(order.tableNumber).padStart(2, '0')}</span>
              </div>
            )}
            {order.customerName && (
              <div className="mt-1 flex justify-between">
                <span>{META_LABELS.customer}</span>
                <span>{order.customerName}</span>
              </div>
            )}
            <div className="mt-1 flex justify-between">
              <span>Type</span>
              <span>{order.orderType}</span>
            </div>
          </section>

          {order.items.length > 0 && (
            <section className="border-b border-dashed border-slate-300 py-3">
              <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
                <span>Item</span>
                <span>Amount</span>
              </div>
              <ul className="mt-2 space-y-2">
                {order.items.map((item) => (
                  <li key={item.id}>
                    <div className="flex justify-between text-sm text-slate-800">
                      <span>
                        {item.quantity} × {item.name}
                      </span>
                      <span>{money(item.lineTotal)}</span>
                    </div>
                    {item.variationName && <p className="ml-5 text-xs text-slate-500">{item.variationName}</p>}
                    {item.addOns && item.addOns.length > 0 && (
                      <p className="ml-5 text-xs text-slate-500">
                        {item.addOns.map((addOn) => `${addOn.name} +${Number(addOn.price).toFixed(2)}`).join(', ')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="border-b border-dashed border-slate-300 py-3 text-sm text-slate-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{money(order.subtotal)}</span>
            </div>
            {Number(order.discountAmount) !== 0 && (
              <div className="mt-1 flex justify-between">
                <span>Discount</span>
                <span>-{money(order.discountAmount)}</span>
              </div>
            )}
            {Number(order.itemDiscountTotal) !== 0 && (
              <div className="mt-1 flex justify-between">
                <span>Item discounts</span>
                <span>-{money(order.itemDiscountTotal)}</span>
              </div>
            )}
            {showServiceCharge && (
              <div className="mt-1 flex justify-between">
                <span>Service charge ({Number(receipt.serviceChargePct).toFixed(1)}%)</span>
                <span>{money(order.serviceChargeAmount)}</span>
              </div>
            )}
            {showTax && (
              <div className="mt-1 flex justify-between">
                <span>Tax ({Number(receipt.taxPercentage).toFixed(1)}%)</span>
                <span>{money(order.taxAmount)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-slate-300 pt-2 text-base font-bold">
              <span>Total</span>
              <span>{money(order.grandTotal)}</span>
            </div>
            {Number(order.totalPaid) !== 0 && (
              <div className="mt-1 flex justify-between text-slate-500">
                <span>Paid</span>
                <span>{money(order.totalPaid)}</span>
              </div>
            )}
            {Number(order.balanceDue) !== 0 && (
              <div className="mt-1 flex justify-between">
                <span>Balance due</span>
                <span>{money(order.balanceDue)}</span>
              </div>
            )}
          </section>

          <footer className="pt-4 text-center">
            {receipt.receiptFooter && (
              <p className="text-xs text-slate-500">{receipt.receiptFooter}</p>
            )}
            <p className="mt-1 text-xs text-slate-400">
              {receipt.order.orderType === 'DINE_IN' ? 'Thank you for dining with us' : 'Thank you for your order'} ·{' '}
              {new Date(receipt.printedAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}