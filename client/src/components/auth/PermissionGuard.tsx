import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Permission } from '@restaurant/shared';
import { useGetMeQuery } from '@/store/api/authApi';
import { Spinner } from '@/components/ui/Spinner';

interface PermissionGuardProps {
  /** At least one of these permissions is required to see the page. */
  permissions: Permission[];
  children: ReactNode;
  /** Where to send a user who is not allowed in. */
  fallbackTo?: string;
}

/**
 * Restricts a route to the accounts that hold one of the given permissions.
 *
 * The server is the authority - this only keeps people out of screens that
 * would immediately fail with a 403.
 */
export function PermissionGuard({ permissions, children, fallbackTo }: PermissionGuardProps) {
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

  const allowed = permissions.some((permission) => user.permissions.includes(permission));

  if (!allowed) {
    return <Navigate to={fallbackTo ?? '/app'} replace />;
  }

  return <>{children}</>;
}
