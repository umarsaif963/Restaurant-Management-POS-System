import type { ReactNode } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import { APP_NAME, APP_VERSION } from '@/constants/routes';

/**
 * Centered branded shell for the standalone auth pages (login, forgot/reset
 * password), which render outside the main application layout.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <UtensilsCrossed className="h-5 w-5" />
          </span>
          <div>
            <p className="text-lg font-bold text-slate-900">{APP_NAME}</p>
            <p className="text-xs text-slate-500">
              {APP_NAME} &middot; v{APP_VERSION}
            </p>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">{children}</div>
      </div>
    </div>
  );
}