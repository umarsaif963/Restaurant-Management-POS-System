import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  maxWidthClass?: string;
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidthClass = 'max-w-lg',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 animate-fade-in bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      {/*
        Phones get a full-height sheet so long forms scroll naturally instead of
        nesting a scrollbar inside a floating card. `sm` restores the centered
        dialog. The header and footer stay put while only the body scrolls.
      */}
      <div
        className={`relative flex w-full animate-fade-in flex-col bg-white shadow-pop sm:max-h-[85vh] sm:animate-scale-in sm:rounded-2xl ${maxWidthClass}`}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-sm font-semibold tracking-tight text-slate-900">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1.5 rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4 sm:max-h-[70vh]">{children}</div>
        {footer && (
          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-4 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
}