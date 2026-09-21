import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import type { UserRole } from '@restaurant/shared';
import { useGetMeQuery } from '@/store/api/authApi';

interface RoleGuardProps {
  roles: UserRole[];
  children: ReactNode;
}

/**
 * Restricts a route to a set of roles. Silent 403: other authenticated roles
 * are redirected to the app index instead of being told the route exists.
 */
export function RoleGuard({ roles, children }: RoleGuardProps) {
  const { data: user } = useGetMeQuery();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}