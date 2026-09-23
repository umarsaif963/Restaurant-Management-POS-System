import type {
  ApiResponse,
  CreateRecipeInput,
  ListRecipesQuery,
  Paginated,
  RecipeProfile,
  UpdateRecipeInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Recipes (module 10) — ingredient bills for menu items with derived cost.
 * Reads are open to every signed-in staff member; mutations are manager/admin
 * only.
 */
export const recipeApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listRecipes: build.query<Paginated<RecipeProfile>, ListRecipesQuery | void>({
      query: (params) => ({ url: '/v1/recipes', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<RecipeProfile>>) => response.data!,
      providesTags: (result) => [
        { type: 'Recipes', id: 'LIST' },
        ...(result?.items ?? []).map((recipe) => ({ type: 'Recipes' as const, id: recipe.id })),
      ],
    }),
    createRecipe: build.mutation<RecipeProfile, CreateRecipeInput>({
      query: (body) => ({ url: '/v1/recipes', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<{ recipe: RecipeProfile }>) => response.data!.recipe,
      invalidatesTags: ['Recipes'],
    }),
    updateRecipe: build.mutation<RecipeProfile, { id: string; data: UpdateRecipeInput }>({
      query: ({ id, data }) => ({ url: `/v1/recipes/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ recipe: RecipeProfile }>) => response.data!.recipe,
      invalidatesTags: ['Recipes'],
    }),
    deleteRecipe: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/recipes/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Recipes'],
    }),
  }),
});

export const {
  useListRecipesQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
} = recipeApi;