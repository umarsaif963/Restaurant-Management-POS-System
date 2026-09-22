import { Spinner } from './Spinner';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="mt-2 text-sm text-slate-500">{message}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" className="btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn-danger" onClick={onConfirm} disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}