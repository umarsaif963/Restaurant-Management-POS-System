import type { ReactNode } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { APP_NAME, APP_VERSION } from '@/constants/routes';

/**
 * Centered branded shell for the standalone auth pages (login, forgot/reset
 * password), which render outside the main application layout.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-slate-50 to-brand-50 px-4 py-10">
      <div
        className="pointer-events-none absolute -top-32 -right-24 h-96 w-96 rounded-full bg-brand-400/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-brand-500/10 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative w-full max-w-md animate-slide-in-up">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-brand-glow">
            <UtensilsCrossed className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xl font-bold tracking-tight text-slate-900">{APP_NAME}</p>
            <p className="mt-0.5 text-xs text-slate-500">
              {APP_NAME} &middot; v{APP_VERSION}
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/60 bg-white p-6 shadow-pop md:p-7">
          {children}
        </div>
      </div>
    </div>
  );
}