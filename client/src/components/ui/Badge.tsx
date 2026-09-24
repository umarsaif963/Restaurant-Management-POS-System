import type { ReactNode } from 'react';

const VARIANTS = {
  slate: 'bg-slate-100 text-slate-600 ring-slate-500/10',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10',
  amber: 'bg-amber-50 text-amber-700 ring-amber-600/10',
  red: 'bg-red-50 text-red-700 ring-red-600/10',
  blue: 'bg-sky-50 text-sky-700 ring-sky-600/10',
} as const;

export type BadgeVariant = keyof typeof VARIANTS;

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant = 'slate', children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}