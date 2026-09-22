import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { useGetKitchenOrderQuery } from '@/store/api/kitchenApi';
import { Spinner } from '@/components/ui/Spinner';
import { KITCHEN_STATUS_LABELS } from '@/constants/kitchen';
import { ORDER_TYPE_LABELS } from '@/constants/order';

export function PrintKitchenPage() {
  const navigate = useNavigate();
  const { kitchenOrderId } = useParams<{ kitchenOrderId: string }>();
  const [printed, setPrinted] = useState(false);

  const { data: ticket, isError, error } = useGetKitchenOrderQuery(kitchenOrderId ?? '', {
    skip: !kitchenOrderId,
  });

  useEffect(() => {
    if (ticket && !printed) {
      setPrinted(true);
      const timer = window.setTimeout(() => window.print(), 150);
      return () => window.clearTimeout(timer);
    }
  }, [ticket, printed]);

  if (isError || (!ticket && !kitchenOrderId)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm font-medium text-red-700">
            {error instanceof Error ? error.message : 'Ticket could not be loaded.'}
          </p>
          <button type="button" className="btn-secondary mt-4" onClick={() => navigate(-1)}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner className="h-6 w-6 text-slate-400" />
      </div>
    );
  }

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

        <div className="print-area rounded-xl border border-slate-300 bg-white p-6">
          <header className="border-b-2 border-dashed border-slate-300 pb-4 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Kitchen ticket</p>
            <h1 className="mt-1 text-2xl font-bold tracking-wide text-slate-900">{ticket.orderNumber}</h1>
            {ticket.ticketNumber > 1 && (
              <p className="text-sm font-semibold text-slate-500">Ticket #{ticket.ticketNumber}</p>
            )}
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-sm text-slate-700">
              <span>
                {ticket.tableNumber !== null
                  ? `Table ${String(ticket.tableNumber).padStart(2, '0')}`
                  : ticket.customerName ?? 'Walk-in'}
              </span>
              <span>·</span>
              <span>{ORDER_TYPE_LABELS[ticket.orderType]}</span>
              <span>·</span>
              <span>{KITCHEN_STATUS_LABELS[ticket.status]}</span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {new Date(ticket.createdAt).toLocaleString(undefined, {
                month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit',
              })}
            </p>
          </header>

          {ticket.notes && (
            <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-lg font-bold text-amber-900">
              {ticket.notes}
            </p>
          )}

          <section className="mt-4">
            <div className="flex justify-between rounded-t-lg bg-slate-900 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              <span>Item</span>
              <span>Qty</span>
            </div>
            <ul className="divide-y divide-slate-200 border border-t-0 border-slate-300">
              {ticket.items.map((item) => (
                <li key={item.id} className="flex gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.variant}</p>
                    {item.notes && <p className="text-sm font-medium text-red-700">“{item.notes}”</p>}
                  </div>
                  <p className="shrink-0 text-lg font-bold text-slate-900">{item.quantity}</p>
                </li>
              ))}
            </ul>
          </section>

          <footer className="mt-4 flex items-center justify-between border-t border-dashed border-slate-300 pt-3 text-xs text-slate-500">
            <span>{ticket.acceptedByName ? `Accepted by ${ticket.acceptedByName}` : 'Not yet accepted'}</span>
            <span>
              {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}