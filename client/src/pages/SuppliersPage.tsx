import { useEffect, useState } from 'react';
import { Pencil, Phone, Plus, RotateCw, Search, Trash2, Truck } from 'lucide-react';
import type { ListSuppliersQuery, SupplierProfile, UserRole } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SupplierFormModal } from '@/components/suppliers/SupplierFormModal';
import { useDeleteSupplierMutation, useListSuppliersQuery } from '@/store/api/supplierApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';

const PAGE_SIZE = 20;
const MANAGER_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER'];

export function SuppliersPage() {
  const toast = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canManage = currentUser ? MANAGER_ROLES.includes(currentUser.role) : false;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierProfile | null>(null);
  const [toDelete, setToDelete] = useState<SupplierProfile | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const query: ListSuppliersQuery = { page, limit: PAGE_SIZE, search: debouncedSearch || undefined };

  const { data, isError, isFetching, refetch } = useListSuppliersQuery(query);
  const [deleteSupplier, { isLoading: deleting }] = useDeleteSupplierMutation();

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deleteSupplier(toDelete.id).unwrap();
      toast.success('Supplier deleted', `${toDelete.name} was removed.`);
      setToDelete(null);
    } catch (error) {
      toast.error('Could not delete supplier', extractApiErrorField(error));
    }
  }

  return (
    <div>
      <PageHeader
        title="Suppliers"
        description="Your vendors for purchase orders and goods-in."
        actions={
          canManage && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" />
              Add supplier
            </button>
          )
        }
      />

      <section className="space-y-6">
        <Card>
          <div className="relative w-full max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9"
              placeholder="Search name, company or email…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search suppliers"
            />
          </div>
        </Card>

        <Card>
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-slate-500">Could not load suppliers.</p>
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
                    <th className="px-4 py-3 font-semibold">Supplier</th>
                    <th className="px-4 py-3 font-semibold">Contact</th>
                    <th className="px-4 py-3 font-semibold">Purchases</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isFetching && !data ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3" colSpan={4}>
                          <Skeleton className="h-5 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : data && data.items.length > 0 ? (
                    data.items.map((supplier) => (
                      <tr key={supplier.id} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{supplier.name}</p>
                          {supplier.company && <p className="text-xs text-slate-500">{supplier.company}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {supplier.phone ? (
                            <p className="flex items-center gap-1">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              {supplier.phone}
                            </p>
                          ) : (
                            <p className="text-slate-400">—</p>
                          )}
                          {supplier.email && <p className="text-xs text-slate-400">{supplier.email}</p>}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{supplier.purchaseCount}</td>
                        <td className="px-4 py-3">
                          {canManage && (
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditing(supplier);
                                  setFormOpen(true);
                                }}
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                title="Edit supplier"
                                aria-label={`Edit ${supplier.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setToDelete(supplier)}
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Delete supplier"
                                aria-label={`Delete ${supplier.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState
                          icon={<Truck className="h-6 w-6" />}
                          title={debouncedSearch ? 'No suppliers found' : 'No suppliers yet'}
                          description={
                            debouncedSearch ? 'Try adjusting your search.' : 'Add suppliers to start creating purchase orders.'
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
              <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
            </div>
          )}
          {isFetching && data && (
            <div className="flex justify-center border-t border-slate-100 py-3">
              <Spinner className="h-4 w-4 text-slate-400" />
            </div>
          )}
        </Card>
      </section>

      <SupplierFormModal open={formOpen} supplier={editing} onClose={() => setFormOpen(false)} />

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete supplier"
        message={
          toDelete
            ? `Delete "${toDelete.name}"? Suppliers with purchase history cannot be deleted.`
            : ''
        }
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

function extractApiErrorField(error: unknown): string {
  const anyError = error as { data?: { message?: string } };
  return anyError.data?.message ?? 'Try again.';
}