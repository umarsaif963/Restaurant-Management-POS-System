import type { Permission } from '@restaurant/shared';
import { useGetMeQuery } from '@/store/api/authApi';

/**
 * The permissions of the signed-in account.
 *
 * The server is the authority - these are the same resolved permissions the
 * API enforces, sent with the session. They are used to hide screens and
 * cards a user can never open, so the interface matches what the account can
 * actually do (a custom role, or a job function with individual grants and
 * revocations).
 */
export function usePermissions(): readonly Permission[] {
  const { data: user } = useGetMeQuery();
  return user?.permissions ?? [];
}

/** True when the account holds at least one of the given permissions. */
export function useHasPermission(permissions: readonly Permission[]): boolean {
  const granted = usePermissions();
  return permissions.some((permission) => granted.includes(permission));
}
