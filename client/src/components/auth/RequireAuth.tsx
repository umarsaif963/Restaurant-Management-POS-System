import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGetMeQuery } from '@/store/api/authApi';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Guards the authenticated application shell: checks the session, shows a
 * splash while it resolves, and redirects to /login when unauthenticated.
 *
 * It also keeps the two workspaces apart: the platform operator is sent to the
 * platform console, everyone else to their restaurant workspace.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { data: user, isLoading, isUninitialized } = useGetMeQuery();

  if (isLoading || isUninitialized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <Spinner className="h-6 w-6 text-slate-400" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isPlatformOperator = user.role === 'SUPER_ADMIN';
  const wantsPlatform = location.pathname.startsWith('/platform');
  const wantsApp = location.pathname.startsWith('/app');

  if (isPlatformOperator && wantsApp) {
    return <Navigate to="/platform" replace />;
  }

  if (!isPlatformOperator && wantsPlatform) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
