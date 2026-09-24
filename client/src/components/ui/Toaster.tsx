import { useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { dismissToast, type ToastType } from '@/store/slices/toastSlice';

const STYLES: Record<ToastType, { container: string; accent: string; icon: typeof Info; iconClass: string }> = {
  success: {
    container: 'bg-white text-slate-900',
    accent: 'border-l-emerald-500',
    icon: CheckCircle2,
    iconClass: 'text-emerald-500',
  },
  error: {
    container: 'bg-white text-slate-900',
    accent: 'border-l-red-500',
    icon: AlertCircle,
    iconClass: 'text-red-500',
  },
  info: {
    container: 'bg-white text-slate-900',
    accent: 'border-l-sky-500',
    icon: Info,
    iconClass: 'text-sky-500',
  },
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
      className={`pointer-events-auto flex w-80 animate-slide-in-right items-start gap-3 rounded-xl border border-slate-100 border-l-4 p-3.5 shadow-pop ${STYLES[type].container} ${STYLES[type].accent}`}
    >
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${STYLES[type].iconClass}`} />
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