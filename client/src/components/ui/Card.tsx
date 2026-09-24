import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function Card({ title, icon, actions, className = '', children }: CardProps) {
  return (
    <section className={`rounded-2xl border border-slate-100 bg-white shadow-card ${className}`}>
      {(title || icon || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2 text-sm font-semibold tracking-tight text-slate-800">
            {icon}
            {title}
          </div>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}