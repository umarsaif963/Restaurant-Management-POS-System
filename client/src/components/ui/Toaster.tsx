import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissToast, type ToastType } from '@/store/slices/toastSlice';

const STYLES: Record<ToastType, { container: string; icon: typeof Info }> = {
  success: { container: 'border-emerald-200 bg-white text-emerald-800', icon: CheckCircle2 },
  error: { container: 'border-red-200 bg-white text-red-800', icon: AlertCircle },
  info: { container: 'border-sky-200 bg-white text-sky-800', icon: Info },
};

function ToastItem({ id, type, title, message }: { id: string; type: ToastType; title: string; message?: string }) {
  const dispatch = useAppDispatch();
  const Icon = STYLES[type].icon;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      dispatch(dismissToast(id));
    }, 5000);
    return () => window.clearTimeout(timer);
  }, [dispatch, id]);

  return (
    <div
      role="status"
      className={`pointer-events-auto flex w-80 items-start gap-3 rounded-lg border p-3 shadow-lg ${STYLES[type].container}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{title}</p>
        {message && <p className="mt-0.5 text-sm text-slate-500">{message}</p>}
      </div>
      <button
        type="button"
        onClick={() => dispatch(dismissToast(id))}
        className="shrink-0 rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useAppSelector((state) => state.toasts.toasts);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} {...toast} />
      ))}
    </div>
  );
}