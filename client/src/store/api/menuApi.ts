import type {
  ApiResponse,
  CreateAddOnInput,
  CreateMenuCategoryInput,
  CreateMenuItemInput,
  CreateVariationInput,
  ListMenuItemsQuery,
  MenuAddOnProfile,
  MenuCategoryProfile,
  MenuItemProfile,
  MenuItemVariationProfile,
  Paginated,
  UpdateAddOnInput,
  UpdateMenuCategoryInput,
  UpdateMenuItemInput,
  UpdateVariationInput,
} from '@restaurant/shared';
import { apiSlice } from './apiSlice';

/**
 * Menu management (module 5) — categories, items, variations and add-ons.
 * Reads are available to every signed-in staff member; every mutation is
 * manager/admin only.
 */
export const menuApi = apiSlice.injectEndpoints({
  endpoints: (build) => ({
    listCategories: build.query<MenuCategoryProfile[], void>({
      query: () => ({ url: '/v1/menu/categories', method: 'GET' }),
      transformResponse: (response: ApiResponse<{ categories: MenuCategoryProfile[] }>) =>
        response.data!.categories,
      providesTags: ['Categories'],
    }),
    createCategory: build.mutation<MenuCategoryProfile, CreateMenuCategoryInput>({
      query: (body) => ({ url: '/v1/menu/categories', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<{ category: MenuCategoryProfile }>) =>
        response.data!.category,
      invalidatesTags: ['Categories'],
    }),
    updateCategory: build.mutation<
      MenuCategoryProfile,
      { id: string; data: UpdateMenuCategoryInput }
    >({
      query: ({ id, data }) => ({ url: `/v1/menu/categories/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ category: MenuCategoryProfile }>) =>
        response.data!.category,
      invalidatesTags: ['Categories', 'MenuItems'],
    }),
    deleteCategory: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/menu/categories/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Categories'],
    }),

    listItems: build.query<Paginated<MenuItemProfile>, ListMenuItemsQuery | void>({
      query: (params) => ({ url: '/v1/menu/items', method: 'GET', params }),
      transformResponse: (response: ApiResponse<Paginated<MenuItemProfile>>) => response.data!,
      providesTags: (result) => [
        { type: 'MenuItems', id: 'LIST' },
        ...(result?.items ?? []).map((item) => ({ type: 'MenuItems' as const, id: item.id })),
      ],
    }),
    createItem: build.mutation<MenuItemProfile, CreateMenuItemInput>({
      query: (body) => ({ url: '/v1/menu/items', method: 'POST', data: body }),
      transformResponse: (response: ApiResponse<{ item: MenuItemProfile }>) => response.data!.item,
      invalidatesTags: ['MenuItems', 'Categories'],
    }),
    updateItem: build.mutation<MenuItemProfile, { id: string; data: UpdateMenuItemInput }>({
      query: ({ id, data }) => ({ url: `/v1/menu/items/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ item: MenuItemProfile }>) => response.data!.item,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'MenuItems', id: arg.id },
        { type: 'MenuItems', id: 'LIST' },
        { type: 'Categories' },
      ],
    }),
    deleteItem: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/menu/items/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'MenuItems', id },
        { type: 'MenuItems', id: 'LIST' },
        { type: 'Categories' },
      ],
    }),

    createVariation: build.mutation<MenuItemVariationProfile, { itemId: string; data: CreateVariationInput }>({
      query: ({ itemId, data }) => ({ url: `/v1/menu/items/${itemId}/variations`, method: 'POST', data }),
      transformResponse: (response: ApiResponse<{ variation: MenuItemVariationProfile }>) =>
        response.data!.variation,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'MenuItems', id: arg.itemId },
        { type: 'MenuItems', id: 'LIST' },
      ],
    }),
    updateVariation: build.mutation<MenuItemVariationProfile, { id: string; data: UpdateVariationInput }>({
      query: ({ id, data }) => ({ url: `/v1/menu/variations/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ variation: MenuItemVariationProfile }>) =>
        response.data!.variation,
      invalidatesTags: (result) => [
        ...(result ? [{ type: 'MenuItems' as const, id: result.menuItemId }] : []),
        { type: 'MenuItems', id: 'LIST' },
      ],
    }),
    deleteVariation: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/menu/variations/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, _id) => [{ type: 'MenuItems', id: 'LIST' }],
    }),

    createAddOn: build.mutation<MenuAddOnProfile, { itemId: string; data: CreateAddOnInput }>({
      query: ({ itemId, data }) => ({ url: `/v1/menu/items/${itemId}/addons`, method: 'POST', data }),
      transformResponse: (response: ApiResponse<{ addOn: MenuAddOnProfile }>) => response.data!.addOn,
      invalidatesTags: (_result, _error, arg) => [
        { type: 'MenuItems', id: arg.itemId },
        { type: 'MenuItems', id: 'LIST' },
      ],
    }),
    updateAddOn: build.mutation<MenuAddOnProfile, { id: string; data: UpdateAddOnInput }>({
      query: ({ id, data }) => ({ url: `/v1/menu/addons/${id}`, method: 'PATCH', data }),
      transformResponse: (response: ApiResponse<{ addOn: MenuAddOnProfile }>) => response.data!.addOn,
      invalidatesTags: (result) => [
        ...(result ? [{ type: 'MenuItems' as const, id: result.menuItemId }] : []),
        { type: 'MenuItems', id: 'LIST' },
      ],
    }),
    deleteAddOn: build.mutation<void, string>({
      query: (id) => ({ url: `/v1/menu/addons/${id}`, method: 'DELETE' }),
      invalidatesTags: (_result, _error, _id) => [{ type: 'MenuItems', id: 'LIST' }],
    }),
  }),
});

export const {
  useListCategoriesQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  useListItemsQuery,
  useCreateItemMutation,
  useUpdateItemMutation,
  useDeleteItemMutation,
  useCreateVariationMutation,
  useUpdateVariationMutation,
  useDeleteVariationMutation,
  useCreateAddOnMutation,
  useUpdateAddOnMutation,
  useDeleteAddOnMutation,
} = menuApi;