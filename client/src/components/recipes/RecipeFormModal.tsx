import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import type { InventoryItemProfile, MenuItemProfile, RecipeProfile } from '@restaurant/shared';
import { Modal } from '@/components/ui/Modal';
import { FormField } from '@/components/ui/FormField';
import { Spinner } from '@/components/ui/Spinner';
import { useCreateRecipeMutation, useUpdateRecipeMutation } from '@/store/api/recipeApi';
import { extractApiError } from '@/services/api';
import { useToast } from '@/hooks/useToast';
import { STOCK_UNIT_LABELS } from '@/constants/inventory';

const recipeFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120, 'Name must be at most 120 characters'),
  menuItemId: z.string().min(1, 'Menu item is required'),
  yield: z.string().trim().regex(/^\d{1,4}$/, 'Enter a valid yield'),
});

type RecipeFormValues = z.infer<typeof recipeFormSchema>;

interface IngredientDraft {
  inventoryItemId: string;
  quantity: string;
}

interface RecipeFormModalProps {
  open: boolean;
  recipe: RecipeProfile | null;
  menuItems: MenuItemProfile[];
  inventoryItems: InventoryItemProfile[];
  onClose: () => void;
}

export function RecipeFormModal({ open, recipe, menuItems, inventoryItems, onClose }: RecipeFormModalProps) {
  const toast = useToast();
  const isEdit = recipe !== null;

  const [createRecipe, { isLoading: creating }] = useCreateRecipeMutation();
  const [updateRecipe, { isLoading: updating }] = useUpdateRecipeMutation();
  const busy = creating || updating;

  const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: { name: '', menuItemId: '', yield: '1' },
  });

  useEffect(() => {
    if (open) {
      reset(
        recipe
          ? { name: recipe.name, menuItemId: recipe.menuItemId, yield: String(recipe.yield) }
          : { name: '', menuItemId: menuItems[0]?.id ?? '', yield: '1' },
      );
      setIngredients(
        recipe
          ? recipe.ingredients.map((ingredient) => ({
              inventoryItemId: ingredient.inventoryItemId,
              quantity: ingredient.quantity,
            }))
          : [{ inventoryItemId: inventoryItems[0]?.id ?? '', quantity: '' }],
      );
    }
  }, [open, recipe, menuItems, inventoryItems, reset]);

  async function onSubmit(values: RecipeFormValues) {
    const clean = ingredients.filter((row) => row.inventoryItemId && row.quantity.trim());
    if (clean.length === 0) {
      toast.error('Recipe needs ingredients', 'Add at least one ingredient with a quantity.');
      return;
    }
    const payload = {
      name: values.name.trim(),
      menuItemId: values.menuItemId,
      yield: Number(values.yield) || 1,
      ingredients: clean.map((row) => ({
        inventoryItemId: row.inventoryItemId,
        quantity: row.quantity.trim(),
      })),
    };
    try {
      if (isEdit) {
        await updateRecipe({ id: recipe.id, data: payload }).unwrap();
        toast.success('Recipe updated', `${values.name} was saved.`);
      } else {
        const created = await createRecipe(payload).unwrap();
        toast.success('Recipe created', `${created.name} linked to its menu item.`);
      }
      onClose();
    } catch (error) {
      toast.error(isEdit ? 'Could not update recipe' : 'Could not create recipe', extractApiError(error).message);
    }
  }

  function itemName(id: string): string {
    return inventoryItems.find((item) => item.id === id)?.name ?? 'Select ingredient';
  }

  return (
    <Modal
      open={open}
      title={isEdit ? `Edit: ${recipe.name}` : 'Add recipe'}
      onClose={onClose}
      maxWidthClass="max-w-2xl"
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" form="recipe-form" className="btn-primary" disabled={busy}>
            {busy ? <Spinner className="h-4 w-4" /> : isEdit ? 'Save changes' : 'Add recipe'}
          </button>
        </>
      }
    >
      <form id="recipe-form" className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Name" htmlFor="recipe-name" error={errors.name?.message} required>
            <input id="recipe-name" className="input" placeholder="e.g. Margherita Pizza" {...register('name')} />
          </FormField>
          <FormField
            label="Menu item"
            htmlFor="recipe-menu-item"
            error={errors.menuItemId?.message}
            required
            hint={isEdit ? 'A recipe is linked to one menu item only.' : undefined}
          >
            <select id="recipe-menu-item" className="input" {...register('menuItemId')} disabled={isEdit}>
              {menuItems.map((menuItem) => (
                <option key={menuItem.id} value={menuItem.id}>
                  {menuItem.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>
        <FormField
          label="Yield"
          htmlFor="recipe-yield"
          error={errors.yield?.message}
          hint="How many servings this recipe produces — cost per unit divides total cost by this."
        >
          <input id="recipe-yield" type="number" min={1} className="input" {...register('yield')} />
        </FormField>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ingredients</span>
            <button
              type="button"
              className="btn-secondary !px-2 !py-1 text-xs"
              onClick={() => setIngredients((rows) => [...rows, { inventoryItemId: '', quantity: '' }])}
            >
              <Plus className="h-3 w-3" />
              Add ingredient
            </button>
          </div>
          {ingredients.length === 0 ? (
            <p className="text-xs text-slate-400">No ingredients. Costs are derived from these lines.</p>
          ) : (
            <div className="space-y-2">
              {ingredients.map((row, index) => (
                <div key={index} className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2">
                  <select
                    className="input flex-1 !py-1.5"
                    value={row.inventoryItemId}
                    aria-label="Inventory item"
                    onChange={(event) =>
                      setIngredients((rows) => rows.map((r, i) => (i === index ? { ...r, inventoryItemId: event.target.value } : r)))
                    }
                  >
                    <option value="">Select ingredient…</option>
                    {inventoryItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({STOCK_UNIT_LABELS[item.unit]})
                      </option>
                    ))}
                  </select>
                  <input
                    className="input !py-1.5 w-28"
                    placeholder="Qty"
                    inputMode="decimal"
                    value={row.quantity}
                    aria-label="Quantity"
                    onChange={(event) =>
                      setIngredients((rows) => rows.map((r, i) => (i === index ? { ...r, quantity: event.target.value } : r)))
                    }
                  />
                  <span className="w-10 shrink-0 text-xs text-slate-400">
                    {row.inventoryItemId ? STOCK_UNIT_LABELS[inventoryItems.find((it) => it.id === row.inventoryItemId)?.unit ?? 'PIECE'] : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIngredients((rows) => rows.filter((_, i) => i !== index))}
                    className="rounded p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove ingredient"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {ingredients.some((row) => row.inventoryItemId && !row.quantity.trim()) && (
            <p className="mt-2 text-xs text-amber-600">{itemName(ingredients.find((row) => row.inventoryItemId && !row.quantity.trim())?.inventoryItemId ?? '')} has no quantity yet.</p>
          )}
        </div>
      </form>
    </Modal>
  );
}