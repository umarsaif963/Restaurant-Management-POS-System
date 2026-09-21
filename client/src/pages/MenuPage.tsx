import { useEffect, useState } from 'react';
import { Pencil, Plus, RotateCw, Search, Trash2, UtensilsCrossed } from 'lucide-react';
import type { ListMenuItemsQuery, MenuCategoryProfile, MenuItemProfile, UserRole } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CategoryFormModal } from '@/components/menu/CategoryFormModal';
import { ItemFormModal } from '@/components/menu/ItemFormModal';
import {
  useDeleteCategoryMutation,
  useDeleteItemMutation,
  useListCategoriesQuery,
  useListItemsQuery,
} from '@/store/api/menuApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { MENU_ITEM_STATUS_BADGE, MENU_ITEM_STATUS_LABELS } from '@/constants/menu';

const PAGE_SIZE = 20;
const MANAGER_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER'];

export function MenuPage() {
  const toast = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canManage = currentUser ? MANAGER_ROLES.includes(currentUser.role) : false;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategoryProfile | null>(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItemProfile | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<MenuCategoryProfile | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItemProfile | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId]);

  const query: ListMenuItemsQuery = {
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
    categoryId: categoryId || undefined,
  };

  const { data: categories, isError: categoriesError, refetch: refetchCategories } = useListCategoriesQuery();
  const { data: items, isError: itemsError, isFetching, refetch: refetchItems } = useListItemsQuery(query);
  const [deleteCategory, { isLoading: deletingCategory }] = useDeleteCategoryMutation();
  const [deleteItem, { isLoading: deletingItem }] = useDeleteItemMutation();

  async function handleDeleteCategory() {
    if (!categoryToDelete) return;
    try {
      await deleteCategory(categoryToDelete.id).unwrap();
      toast.success('Category deleted', `${categoryToDelete.name} has been removed.`);
      if (categoryId === categoryToDelete.id) setCategoryId('');
      setCategoryToDelete(null);
    } catch {
      toast.error('Could not delete category', 'Move its items elsewhere or delete them first.');
    }
  }

  async function handleDeleteItem() {
    if (!itemToDelete) return;
    try {
      await deleteItem(itemToDelete.id).unwrap();
      toast.success('Item deleted', `${itemToDelete.name} was removed from the menu.`);
      setItemToDelete(null);
    } catch {
      toast.error('Could not delete item', 'Deactivate it instead if it has order history.');
    }
  }

  const openCreateCategory = () => {
    setEditingCategory(null);
    setCategoryModalOpen(true);
  };

  const openEditCategory = (category: MenuCategoryProfile) => {
    setEditingCategory(category);
    setCategoryModalOpen(true);
  };

  const openCreateItem = () => {
    setEditingItem(null);
    setItemModalOpen(true);
  };

  const openEditItem = (item: MenuItemProfile) => {
    setEditingItem(item);
    setItemModalOpen(true);
  };

  const error = categoriesError || itemsError;

  return (
    <div>
      <PageHeader
        title="Menu"
        description="Categories, items, variations and add-ons."
        actions={
          canManage && (
            <div className="flex gap-2">
              <button type="button" className="btn-secondary" onClick={openCreateCategory}>
                <Plus className="h-4 w-4" />
                Add category
              </button>
              <button type="button" className="btn-primary" onClick={openCreateItem}>
                <Plus className="h-4 w-4" />
                Add item
              </button>
            </div>
          )
        }
      />

      {error ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-slate-500">Could not load the menu.</p>
          <button type="button" className="btn-secondary" onClick={() => { refetchCategories(); refetchItems(); }}>
            <RotateCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      ) : (
        <section className="space-y-6">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={categoryId === '' ? 'chip chip-active' : 'chip'}
                  onClick={() => setCategoryId('')}
                >
                  All
                </button>
                {(categories ?? []).map((category) => (
                  <div key={category.id} className="flex items-center gap-1">
                    <button
                      type="button"
                      className={categoryId === category.id ? 'chip chip-active' : 'chip'}
                      onClick={() => setCategoryId(category.id)}
                    >
                      {category.name}
                      <span className="ml-1 text-xs opacity-70">({category.itemCount})</span>
                    </button>
                    {canManage && (
                      <>
                        <button
                          type="button"
                          onClick={() => openEditCategory(category)}
                          className="rounded p-1 text-slate-300 transition hover:bg-slate-100 hover:text-slate-700"
                          title="Edit category"
                          aria-label={`Edit category ${category.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setCategoryToDelete(category)}
                          className="rounded p-1 text-slate-300 transition hover:bg-red-50 hover:text-red-600"
                          title="Delete category"
                          aria-label={`Delete category ${category.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {canManage && (
                <div className="flex gap-1">
                  <button
                    type="button"
                    className="rounded-lg px-2 py-1 text-xs text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                    onClick={() => {
                      setEditingCategory(null);
                      setCategoryModalOpen(true);
                    }}
                  >
                    + Category
                  </button>
                </div>
              )}
              <div className="relative w-full max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  className="input pl-9"
                  placeholder="Search name or SKU…"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  aria-label="Search menu items"
                />
              </div>
            </div>
          </Card>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Item</th>
                    <th className="px-4 py-3 font-semibold">Price</th>
                    <th className="px-4 py-3 font-semibold">Tax</th>
                    <th className="px-4 py-3 font-semibold">Prep</th>
                    <th className="px-4 py-3 font-semibold">Variations</th>
                    <th className="px-4 py-3 font-semibold">Add-ons</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isFetching && !items ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3" colSpan={8}>
                          <Skeleton className="h-5 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : items && items.items.length > 0 ? (
                    items.items.map((item) => (
                      <tr key={item.id} className="transition hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{item.name}</p>
                          <p className="text-xs text-slate-500">
                            {item.categoryName}
                            {item.sku && <span className="ml-2 font-mono">{item.sku}</span>}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{item.price}</td>
                        <td className="px-4 py-3 text-slate-600">{item.taxRate}%</td>
                        <td className="px-4 py-3 text-slate-600">{item.preparationTime ? `${item.preparationTime} min` : '—'}</td>
                        <td className="px-4 py-3 text-slate-600">{item.variations.length}</td>
                        <td className="px-4 py-3 text-slate-600">{item.addOns.length}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Badge variant={MENU_ITEM_STATUS_BADGE[item.status]}>
                              {MENU_ITEM_STATUS_LABELS[item.status]}
                            </Badge>
                            {!item.available && item.status === 'ACTIVE' && (
                              <span className="text-xs text-amber-600" title="Hidden from ordering">
                                hidden
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {canManage && (
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openEditItem(item)}
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                title="Edit item"
                                aria-label={`Edit ${item.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setItemToDelete(item)}
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Delete item"
                                aria-label={`Delete ${item.name}`}
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
                      <td colSpan={8}>
                        <EmptyState
                          icon={<UtensilsCrossed className="h-6 w-6" />}
                          title={debouncedSearch ? 'No items found' : categoryId ? 'This category is empty' : 'No items yet'}
                          description={
                            debouncedSearch
                              ? 'Try adjusting your search.'
                              : 'Add an item to start building your menu.'
                          }
                        />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {items && items.total > 0 && (
              <div className="border-t border-slate-100 px-4 py-3">
                <Pagination page={items.page} totalPages={items.totalPages} total={items.total} onPageChange={setPage} />
              </div>
            )}
            {isFetching && items && (
              <div className="flex justify-center border-t border-slate-100 py-3">
                <Spinner className="h-4 w-4 text-slate-400" />
              </div>
            )}
          </Card>
        </section>
      )}

      <CategoryFormModal
        open={categoryModalOpen}
        category={editingCategory}
        onClose={() => setCategoryModalOpen(false)}
      />

      <ItemFormModal
        open={itemModalOpen}
        item={editingItem}
        categories={categories ?? []}
        onClose={() => setItemModalOpen(false)}
      />

      <ConfirmDialog
        open={categoryToDelete !== null}
        title="Delete category"
        message={
          categoryToDelete
            ? `Delete "${categoryToDelete.name}"? Categories that still contain items cannot be deleted.`
            : ''
        }
        confirmLabel="Delete"
        busy={deletingCategory}
        onCancel={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteCategory}
      />

      <ConfirmDialog
        open={itemToDelete !== null}
        title="Delete item"
        message={
          itemToDelete
            ? `Delete "${itemToDelete.name}"? It cannot be deleted if it has order history — deactivate it instead.`
            : ''
        }
        confirmLabel="Delete"
        busy={deletingItem}
        onCancel={() => setItemToDelete(null)}
        onConfirm={handleDeleteItem}
      />
    </div>
  );
}