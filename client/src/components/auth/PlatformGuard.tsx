import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useGetMeQuery } from '@/store/api/authApi';
import { Spinner } from '@/components/ui/Spinner';

interface PlatformGuardProps {
  children: ReactNode;
}

/**
 * Guards the platform console. Only the platform operator (SUPER_ADMIN) may
 * look across restaurants; everyone else is sent back to their workspace.
 */
export function PlatformGuard({ children }: PlatformGuardProps) {
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

  if (user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
