import { useEffect, useState } from 'react';
import { Pencil, Plus, RotateCw, Search, Trash2, UserPlus, Users } from 'lucide-react';
import type { CustomerProfile, ListCustomersQuery, UserRole } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomerFormModal } from '@/components/customers/CustomerFormModal';
import { useDeleteCustomerMutation, useListCustomersQuery } from '@/store/api/customerApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';

const PAGE_SIZE = 20;
const MANAGER_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER'];

export function CustomersPage() {
  const toast = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canManage = currentUser ? MANAGER_ROLES.includes(currentUser.role) : false;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerProfile | null>(null);
  const [deleting, setDeleting] = useState<CustomerProfile | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const query: ListCustomersQuery = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
  };

  const { data, isError, isFetching, refetch } = useListCustomersQuery(query);
  const [deleteCustomer, { isLoading: deletingBusy }] = useDeleteCustomerMutation();

  async function handleDelete() {
    if (!deleting) return;
    try {
      await deleteCustomer(deleting.id).unwrap();
      toast.success('Customer deleted', `${deleting.name} was removed from the directory.`);
      setDeleting(null);
    } catch {
      toast.error('Could not delete customer', 'The operation failed. Please try again.');
    }
  }

  function openCreate() {
    setEditingCustomer(null);
    setModalOpen(true);
  }

  function openEdit(customer: CustomerProfile) {
    setEditingCustomer(customer);
    setModalOpen(true);
  }

  return (
    <div>
      <PageHeader
        title="Customers"
        description="Guest directory with contact details and spending history."
        actions={
          <button type="button" className="btn-primary" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Add customer
          </button>
        }
      />

      <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              className="input pl-9"
              placeholder="Search name, phone or email…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search customers"
            />
          </div>
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-sm text-slate-500">Could not load customers.</p>
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
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Phone</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Orders</th>
                  <th className="px-4 py-3 font-semibold">Total spent</th>
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
                  data.items.map((customer) => (
                    <tr key={customer.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800">{customer.name}</p>
                        {customer.address && <p className="text-xs text-slate-500">{customer.address}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{customer.phone ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{customer.email ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{customer.totalOrders}</td>
                      <td className="px-4 py-3 text-slate-600">{customer.totalSpending}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          {canManage && (
                            <>
                              <button
                                type="button"
                                onClick={() => openEdit(customer)}
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                title="Edit customer"
                                aria-label={`Edit ${customer.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleting(customer)}
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Delete customer"
                                aria-label={`Delete ${customer.name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
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
                        title="No customers found"
                        description={
                          debouncedSearch
                            ? 'Try adjusting your search.'
                            : 'Add customers to track their visits and spending.'
                        }
                        action={
                          !debouncedSearch ? (
                            <button type="button" className="btn-secondary" onClick={openCreate}>
                              <UserPlus className="h-4 w-4" />
                              Add customer
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
            <Pagination page={data.page} totalPages={data.totalPages} total={data.total} onPageChange={setPage} />
          </div>
        )}
        {isFetching && data && (
          <div className="flex justify-center border-t border-slate-100 py-3">
            <Spinner className="h-4 w-4 text-slate-400" />
          </div>
        )}
      </section>

      <CustomerFormModal open={modalOpen} customer={editingCustomer} onClose={() => setModalOpen(false)} />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete customer"
        message={
          deleting
            ? `Delete ${deleting.name}? Their order history will be detached (not destroyed).`
            : ''
        }
        confirmLabel="Delete"
        busy={deletingBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}