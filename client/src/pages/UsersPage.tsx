import { useEffect, useState } from 'react';
import { Pencil, Plus, RotateCw, Search, Trash2, UserPlus, Users } from 'lucide-react';
import type { AuthUser, ListUsersQuery, UserRole, UserStatus } from '@restaurant/shared';
import { USER_ROLES, USER_STATUSES } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserFormModal } from '@/components/users/UserFormModal';
import { useDeactivateUserMutation, useListUsersQuery } from '@/store/api/userApi';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateTime } from '@/utils/format';
import { ROLE_BADGE, ROLE_LABELS, STATUS_BADGE, STATUS_LABELS } from '@/constants/user';

const PAGE_SIZE = 20;

export function UsersPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [deactivating, setDeactivating] = useState<AuthUser | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status]);

  const query: ListUsersQuery = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    role: role || undefined,
    status: status || undefined,
  };

  const { data, isError, isFetching, refetch } = useListUsersQuery(query);
  const [deactivateUser, { isLoading: deactivatingBusy }] = useDeactivateUserMutation();

  async function handleDeactivate() {
    if (!deactivating) return;
    try {
      await deactivateUser(deactivating.id).unwrap();
      toast.success('User deactivated', `${deactivating.name} can no longer sign in.`);
      setDeactivating(null);
    } catch {
      toast.error('Could not deactivate user', 'The operation failed. Please try again.');
    }
  }

  function openCreate() {
    setEditingUser(null);
    setModalOpen(true);
  }

  function openEdit(user: AuthUser) {
    setEditingUser(user);
    setModalOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Users"
        description="Staff accounts, roles and access control."
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add user
          </button>
        }
      />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9"
              placeholder="Search name, email or phone…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search users"
            />
          </div>
          <div className="flex gap-2">
            <select className="input w-auto" value={role} onChange={(event) => setRole(event.target.value as UserRole | '')} aria-label="Filter by role">
              <option value="">All roles</option>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <select className="input w-auto" value={status} onChange={(event) => setStatus(event.target.value as UserStatus | '')} aria-label="Filter by status">
              <option value="">All statuses</option>
              {USER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABELS[s]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-slate-500">Could not load users.</p>
            <button type="button" className="btn-secondary" onClick={() => refetch()}>
              <RotateCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Last login</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isFetching && !data ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3" colSpan={6}>
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                ) : data && data.items.length > 0 ? (
                  data.items.map((user) => (
                    <tr key={user.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={ROLE_BADGE[user.role]}>{ROLE_LABELS[user.role]}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_BADGE[user.status]}>{STATUS_LABELS[user.status]}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{user.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(user)}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Edit user"
                            aria-label={`Edit ${user.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeactivating(user)}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                            title="Deactivate user"
                            aria-label={`Deactivate ${user.name}`}
                            disabled={user.status !== 'ACTIVE'}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<Users className="h-6 w-6" />}
                        title="No users found"
                        description={
                          debouncedSearch
                            ? 'Try adjusting your search or filters.'
                            : 'Create your first staff account to get started.'
                        }
                        action={
                          !debouncedSearch ? (
                            <button type="button" className="btn-secondary" onClick={openCreate}>
                              <UserPlus className="h-4 w-4" />
                              Add user
                            </button>
                          ) : undefined
                        }
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {data && data.total > 0 && (
          <div className="border-t border-slate-100 px-4 py-3">
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              total={data.total}
              onPageChange={setPage}
            />
          </div>
        )}
        {isFetching && data && (
          <div className="flex justify-center border-t border-slate-100 py-3">
            <Spinner className="h-4 w-4 text-slate-400" />
          </div>
        )}
      </section>

      <UserFormModal open={modalOpen} user={editingUser} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        open={deactivating !== null}
        title="Deactivate user"
        message={
          deactivating
            ? `Deactivate ${deactivating.name}? They will be signed out immediately and unable to log in again. This can be reversed by an administrator.`
            : ''
        }
        confirmLabel="Deactivate"
        busy={deactivatingBusy}
        onCancel={() => setDeactivating(null)}
        onConfirm={handleDeactivate}
      />
    </div>
  );
}