import { useEffect, useState } from 'react';
import { Pencil, Plus, RotateCw, Search, Trash2, UtensilsCrossed } from 'lucide-react';
import type { ListRecipesQuery, MenuItemProfile, RecipeProfile, UserRole } from '@restaurant/shared';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { RecipeFormModal } from '@/components/recipes/RecipeFormModal';
import { useDeleteRecipeMutation, useListRecipesQuery } from '@/store/api/recipeApi';
import { useListInventoryItemQuery } from '@/store/api/inventoryApi';
import { useListItemsQuery } from '@/store/api/menuApi';
import { useAppSelector } from '@/store/hooks';
import { useToast } from '@/hooks/useToast';
import { useDebounce } from '@/hooks/useDebounce';
import { STOCK_UNIT_LABELS } from '@/constants/inventory';

const PAGE_SIZE = 20;
const MANAGER_ROLES: readonly UserRole[] = ['ADMIN', 'MANAGER'];

export function RecipesPage() {
  const toast = useToast();
  const currentUser = useAppSelector((state) => state.auth.user);
  const canManage = currentUser ? MANAGER_ROLES.includes(currentUser.role) : false;

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<RecipeProfile | null>(null);
  const [toDelete, setToDelete] = useState<RecipeProfile | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  const query: ListRecipesQuery = { page, limit: PAGE_SIZE, search: debouncedSearch || undefined };

  const { data, isError, isFetching, refetch } = useListRecipesQuery(query);
  const { data: inventory } = useListInventoryItemQuery({ limit: 100 });
  const { data: menu } = useListItemsQuery({ limit: 100 });
  const [deleteRecipe, { isLoading: deleting }] = useDeleteRecipeMutation();

  const inventoryItems = inventory?.items ?? [];
  const menuItems = (menu?.items ?? []) as MenuItemProfile[];

  async function handleDelete() {
    if (!toDelete) return;
    try {
      await deleteRecipe(toDelete.id).unwrap();
      toast.success('Recipe deleted', `${toDelete.name} was removed.`);
      setToDelete(null);
    } catch {
      toast.error('Could not delete recipe', 'The operation failed. Please try again.');
    }
  }

  return (
    <div>
      <PageHeader
        title="Recipes"
        description="Ingredient bills and derived dish costs."
        actions={
          canManage && (
            <button type="button" className="btn-primary" onClick={() => { setEditingRecipe(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4" />
              Add recipe
            </button>
          )
        }
      />

      <section className="space-y-6">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                className="input pl-9"
                placeholder="Search recipe or menu item…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search recipes"
              />
            </div>
          </div>
        </Card>

        <Card>
          {isError ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <p className="text-sm text-slate-500">Could not load recipes.</p>
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
                    <th className="px-4 py-3 font-semibold">Recipe</th>
                    <th className="px-4 py-3 font-semibold">Serves</th>
                    <th className="px-4 py-3 font-semibold">Total cost</th>
                    <th className="px-4 py-3 font-semibold">Cost / unit</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {isFetching && !data ? (
                    Array.from({ length: 6 }).map((_, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3" colSpan={5}>
                          <Skeleton className="h-5 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : data && data.items.length > 0 ? (
                    data.items.map((recipe) => (
                      <tr key={recipe.id} className="align-top transition hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{recipe.name}</p>
                          <p className="text-xs text-slate-500">Menu item: {recipe.menuItemName}</p>
                          {recipe.hasIngredients ? (
                            <ul className="mt-1 space-y-0.5">
                              {recipe.ingredients.map((ingredient) => (
                                <li key={ingredient.id} className="text-xs text-slate-600">
                                  {ingredient.quantity} {STOCK_UNIT_LABELS[ingredient.unit]} {ingredient.itemName}
                                  <span className="ml-1 text-slate-400">(${ingredient.lineCost})</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="mt-1 text-xs text-amber-600">No ingredients — costs are zero.</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{recipe.yield}</td>
                        <td className="px-4 py-3 font-medium text-slate-800">${recipe.totalCost}</td>
                        <td className="px-4 py-3 text-slate-600">${recipe.costPerUnit}</td>
                        <td className="px-4 py-3">
                          {canManage && (
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => { setEditingRecipe(recipe); setFormOpen(true); }}
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                title="Edit recipe"
                                aria-label={`Edit ${recipe.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setToDelete(recipe)}
                                className="rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                title="Delete recipe"
                                aria-label={`Delete ${recipe.name}`}
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
                      <td colSpan={5}>
                        <EmptyState
                          icon={<UtensilsCrossed className="h-6 w-6" />}
                          title={debouncedSearch ? 'No recipes found' : 'No recipes yet'}
                          description={
                            debouncedSearch ? 'Try adjusting your search.' : 'Add ingredient bills for your menu items.'
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

      <RecipeFormModal
        open={formOpen}
        recipe={editingRecipe}
        menuItems={menuItems}
        inventoryItems={inventoryItems}
        onClose={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete recipe"
        message={toDelete ? `Delete "${toDelete.name}"? The menu item itself is not affected.` : ''}
        confirmLabel="Delete"
        busy={deleting}
        onCancel={() => setToDelete(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}