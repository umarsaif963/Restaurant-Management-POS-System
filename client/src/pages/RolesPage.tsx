import { useState } from 'react';
import { Pencil, Plus, RotateCw, ShieldCheck, Trash2, Users } from 'lucide-react';
import type { RoleProfile } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RoleFormModal } from '@/components/roles/RoleFormModal';
import { useDeleteRoleMutation, useListRolesQuery } from '@/store/api/roleApi';
import { useToast } from '@/hooks/useToast';

export function RolesPage() {
  const toast = useToast();
  const { data: roles, isError, isFetching, refetch } = useListRolesQuery();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleProfile | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleProfile | null>(null);
  const [deleteRole, { isLoading: deleting }] = useDeleteRoleMutation();

  function openCreate() {
    setEditingRole(null);
    setModalOpen(true);
  }

  function openEdit(role: RoleProfile) {
    setEditingRole(role);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deletingRole) return;
    try {
      await deleteRole(deletingRole.id).unwrap();
      toast.success('Role deleted', `${deletingRole.name} has been removed.`);
      setDeletingRole(null);
    } catch {
      toast.error('Could not delete role', 'The operation failed. Please try again.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Custom permission sets you can attach to your employees."
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            New role
          </button>
        }
      />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        {isError ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-slate-500">Could not load roles.</p>
            <button type="button" className="btn-secondary" onClick={() => refetch()}>
              <RotateCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        ) : isFetching && !roles ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full" />
            ))}
          </div>
        ) : roles && roles.length > 0 ? (
          <div className="scroll-x">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Role</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Type</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Permissions</th>
                  <th className="px-3 sm:px-4 py-3 font-semibold">Members</th>
                  <th className="px-3 sm:px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {roles.map((role) => (
                  <tr key={role.id} className="transition hover:bg-slate-50">
                    <td className="px-3 sm:px-4 py-3">
                      <p className="font-medium text-slate-800">{role.name}</p>
                      {role.description && (
                        <p className="text-xs text-slate-500">{role.description}</p>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      {role.isSystem ? (
                        <Badge variant="slate">Built-in</Badge>
                      ) : (
                        <Badge variant="blue">Custom</Badge>
                      )}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-slate-600">
                      {role.permissions.length}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5 text-slate-400" />
                        {role.memberCount}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(role)}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                          title="Edit role"
                          aria-label={`Edit ${role.name}`}
                          disabled={role.isSystem}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingRole(role)}
                          className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          title="Delete role"
                          aria-label={`Delete ${role.name}`}
                          disabled={role.isSystem}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={<ShieldCheck className="h-6 w-6" />}
            title="No roles yet"
            description="Create a role to give a colleague exactly the access they need."
            action={
              <button type="button" className="btn-secondary" onClick={openCreate}>
                <Plus className="h-4 w-4" />
                New role
              </button>
            }
          />
        )}
        {isFetching && roles && (
          <div className="flex justify-center border-t border-slate-100 py-3">
            <Spinner className="h-4 w-4 text-slate-400" />
          </div>
        )}
      </section>

      <RoleFormModal
        open={modalOpen}
        role={editingRole}
        onClose={() => setModalOpen(false)}
      />

      <ConfirmDialog
        open={deletingRole !== null}
        title="Delete role"
        message={
          deletingRole
            ? `Delete ${deletingRole.name}? Roles that are still assigned to employees cannot be deleted.`
            : ''
        }
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setDeletingRole(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
