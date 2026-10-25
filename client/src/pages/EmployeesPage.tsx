import { useEffect, useState } from 'react';
import {
  KeyRound,
  Pencil,
  Plus,
  RotateCw,
  Search,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import type { EmployeeProfile, ListEmployeesQuery, UserRole, UserStatus } from '@restaurant/shared';
import { RESTAURANT_USER_ROLES, USER_STATUSES } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmployeeFormModal } from '@/components/employees/EmployeeFormModal';
import {
  useDeactivateEmployeeMutation,
  useListEmployeesQuery,
  useReactivateEmployeeMutation,
  useResetEmployeePasswordMutation,
} from '@/store/api/employeeApi';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { formatDateTime } from '@/utils/format';
import { ROLE_BADGE, ROLE_LABELS, STATUS_BADGE, STATUS_LABELS } from '@/constants/user';

const PAGE_SIZE = 20;

export function EmployeesPage() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<UserRole | ''>('');
  const [status, setStatus] = useState<UserStatus | ''>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeProfile | null>(null);
  const [deactivating, setDeactivating] = useState<EmployeeProfile | null>(null);
  const [reactivating, setReactivating] = useState<EmployeeProfile | null>(null);
  const [resetting, setResetting] = useState<EmployeeProfile | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, role, status]);

  const query: ListEmployeesQuery = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    role: role || undefined,
    status: status || undefined,
  };

  const { data, isError, isFetching, refetch } = useListEmployeesQuery(query);
  const [deactivateEmployee, { isLoading: deactivatingBusy }] = useDeactivateEmployeeMutation();
  const [reactivateEmployee, { isLoading: reactivatingBusy }] = useReactivateEmployeeMutation();
  const [resetPassword, { isLoading: resettingBusy }] = useResetEmployeePasswordMutation();

  async function handleDeactivate() {
    if (!deactivating) return;
    try {
      await deactivateEmployee(deactivating.id).unwrap();
      toast.success('Employee deactivated', `${deactivating.name} can no longer sign in.`);
      setDeactivating(null);
    } catch {
      toast.error('Could not deactivate employee', 'The operation failed. Please try again.');
    }
  }

  async function handleReactivate() {
    if (!reactivating) return;
    try {
      await reactivateEmployee(reactivating.id).unwrap();
      toast.success('Employee reactivated', `${reactivating.name} can sign in again.`);
      setReactivating(null);
    } catch {
      toast.error('Could not reactivate employee', 'The operation failed. Please try again.');
    }
  }

  async function handleResetPassword() {
    if (!resetting) return;
    try {
      const result = await resetPassword(resetting.id).unwrap();
      toast.success(
        'Temporary password issued',
        `Share it with ${resetting.name}: ${result.temporaryPassword}`,
      );
      setResetting(null);
    } catch {
      toast.error('Could not reset password', 'The operation failed. Please try again.');
    }
  }

  function openCreate() {
    setEditingEmployee(null);
    setModalOpen(true);
  }

  function openEdit(employee: EmployeeProfile) {
    setEditingEmployee(employee);
    setModalOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Employees"
        description="Staff accounts, roles and access control."
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add employee
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
              aria-label="Search employees"
            />
          </div>
          <div className="flex gap-2">
            <select
              className="input w-auto"
              value={role}
              onChange={(event) => setRole(event.target.value as UserRole | '')}
              aria-label="Filter by role"
            >
              <option value="">All roles</option>
              {RESTAURANT_USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <select
              className="input w-auto"
              value={status}
              onChange={(event) => setStatus(event.target.value as UserStatus | '')}
              aria-label="Filter by status"
            >
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
            <p className="text-sm text-slate-500">Could not load employees.</p>
            <button type="button" className="btn-secondary" onClick={() => refetch()}>
              <RotateCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : (
          <div className="scroll-x">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Employee</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Role</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Status</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Phone</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Last login</th>
                  <th className="px-3 sm:px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isFetching && !data ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <tr key={index}>
                      <td className="px-3 sm:px-4 py-3" colSpan={6}>
                        <Skeleton className="h-5 w-full" />
                      </td>
                    </tr>
                  ))
                ) : data && data.items.length > 0 ? (
                  data.items.map((employee) => (
                    <tr key={employee.id} className="transition hover:bg-slate-50">
                      <td className="px-3 sm:px-4 py-3">
                        <p className="font-medium text-slate-800">{employee.name}</p>
                        <p className="text-xs text-slate-500">{employee.email}</p>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <Badge variant={ROLE_BADGE[employee.role]}>
                          {employee.customRoleName ?? ROLE_LABELS[employee.role]}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <Badge variant={STATUS_BADGE[employee.status]}>
                          {STATUS_LABELS[employee.status]}
                        </Badge>
                      </td>
                      <td className="px-3 sm:px-4 py-3 text-slate-600">{employee.phone ?? '—'}</td>
                      <td className="px-3 sm:px-4 py-3 text-slate-600">
                        {employee.lastLoginAt ? formatDateTime(employee.lastLoginAt) : 'Never'}
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(employee)}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Edit employee"
                            aria-label={`Edit ${employee.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setResetting(employee)}
                            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                            title="Issue a temporary password"
                            aria-label={`Reset password for ${employee.name}`}
                          >
                            <KeyRound className="h-4 w-4" />
                          </button>
                          {employee.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => setDeactivating(employee)}
                              className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                              title="Deactivate employee"
                              aria-label={`Deactivate ${employee.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setReactivating(employee)}
                              className="rounded-md p-1.5 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
                              title="Reactivate employee"
                              aria-label={`Reactivate ${employee.name}`}
                            >
                              <UserCheck className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState
                        icon={<Users className="h-6 w-6" />}
                        title="No employees found"
                        description={
                          debouncedSearch
                            ? 'Try adjusting your search or filters.'
                            : 'Create your first staff account to get started.'
                        }
                        action={
                          !debouncedSearch ? (
                            <button type="button" className="btn-secondary" onClick={openCreate}>
                              <UserPlus className="h-4 w-4" />
                              Add employee
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

      <EmployeeFormModal
        open={modalOpen}
        employee={editingEmployee}
        onClose={() => setModalOpen(false)}
      />

      <ConfirmDialog
        open={deactivating !== null}
        title="Deactivate employee"
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

      <ConfirmDialog
        open={reactivating !== null}
        title="Reactivate employee"
        message={
          reactivating
            ? `Give ${reactivating.name} access to the workspace again?`
            : ''
        }
        confirmLabel="Reactivate"
        busy={reactivatingBusy}
        onCancel={() => setReactivating(null)}
        onConfirm={handleReactivate}
      />

      <ConfirmDialog
        open={resetting !== null}
        title="Issue a temporary password"
        message={
          resetting
            ? `A new temporary password will be generated for ${resetting.name} and every active session of that account will be signed out.`
            : ''
        }
        confirmLabel="Issue password"
        busy={resettingBusy}
        onCancel={() => setResetting(null)}
        onConfirm={handleResetPassword}
      />
    </div>
  );
}
