import type {
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
import { Prisma, type AddOn, type MenuCategory, type MenuItemVariation } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { ApiError } from '../utils/ApiError.js';

function toCategory(category: MenuCategory & { _count?: { items: number } }): MenuCategoryProfile {
  return {
    id: category.id,
    name: category.name,
    description: category.description,
    position: category.position,
    status: category.status,
    itemCount: category._count?.items ?? 0,
  };
}

function toVariation(variation: MenuItemVariation): MenuItemVariationProfile {
  return {
    id: variation.id,
    menuItemId: variation.menuItemId,
    name: variation.name,
    priceAdjustment: variation.priceAdjustment.toString(),
    isDefault: variation.isDefault,
    createdAt: variation.createdAt.toISOString(),
  };
}

function toAddOn(addOn: AddOn): MenuAddOnProfile {
  return {
    id: addOn.id,
    menuItemId: addOn.menuItemId,
    name: addOn.name,
    price: addOn.price.toString(),
    available: addOn.available,
    createdAt: addOn.createdAt.toISOString(),
  };
}

type MenuItemWithRelations = Prisma.MenuItemGetPayload<{
  include: {
    category: { select: { name: true } };
    variations: true;
    addOns: true;
  };
}>;

function toItem(item: MenuItemWithRelations): MenuItemProfile {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price.toString(),
    sku: item.sku,
    categoryId: item.categoryId,
    categoryName: item.category.name,
    taxRate: item.taxRate.toString(),
    preparationTime: item.preparationTime,
    available: item.available,
    imageUrl: item.imageUrl,
    position: item.position,
    status: item.status,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    variations: item.variations.map(toVariation),
    addOns: item.addOns.map(toAddOn),
  };
}

const itemInclude = (): Prisma.MenuItemInclude => ({
  category: { select: { name: true } },
  variations: { orderBy: { createdAt: 'asc' } },
  addOns: { orderBy: { createdAt: 'asc' } },
});

// ---- Categories ----------------------------------------------

export async function listCategories(): Promise<MenuCategoryProfile[]> {
  const categories = await prisma.menuCategory.findMany({
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    include: { _count: { select: { items: true } } },
  });
  return categories.map(toCategory);
}

async function requireCategory(id: string): Promise<MenuCategory> {
  const category = await prisma.menuCategory.findUnique({ where: { id } });
  if (!category) {
    throw ApiError.notFound('Menu category not found');
  }
  return category;
}

async function toCategoryResult(category: MenuCategory): Promise<MenuCategoryProfile> {
  const itemCount = await prisma.menuItem.count({ where: { categoryId: category.id } });
  return { ...toCategory(category), itemCount };
}

export async function createCategory(
  input: CreateMenuCategoryInput,
): Promise<MenuCategoryProfile> {
  const category = await prisma.menuCategory.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      position: input.position ?? 0,
    },
  });
  return toCategoryResult(category);
}

export async function updateCategory(
  id: string,
  input: UpdateMenuCategoryInput,
): Promise<MenuCategoryProfile> {
  await requireCategory(id);
  const category = await prisma.menuCategory.update({ where: { id }, data: input });
  return toCategoryResult(category);
}

export async function deleteCategory(id: string): Promise<void> {
  await requireCategory(id);
  const itemCount = await prisma.menuItem.count({ where: { categoryId: id } });
  if (itemCount > 0) {
    throw ApiError.conflict(
      `Cannot delete a category that still contains ${itemCount} menu item(s). Move or delete them first.`,
    );
  }
  await prisma.menuCategory.delete({ where: { id } });
}

// ---- Menu items ----------------------------------------------

export async function listItems(params: ListMenuItemsQuery): Promise<Paginated<MenuItemProfile>> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const where: Prisma.MenuItemWhereInput = {};
  if (params.search) {
    where.OR = [
      { name: { contains: params.search, mode: 'insensitive' } },
      { sku: { contains: params.search, mode: 'insensitive' } },
    ];
  }
  if (params.categoryId) {
    where.categoryId = params.categoryId;
  }
  if (params.status) {
    where.status = params.status;
  }

  const [total, rows] = await prisma.$transaction([
    prisma.menuItem.count({ where }),
    prisma.menuItem.findMany({
      where,
      orderBy: [{ category: { position: 'asc' } }, { position: 'asc' }, { name: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: itemInclude(),
    }),
  ]);

  return {
    items: rows.map(toItem),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

async function requireItem(id: string): Promise<MenuItemWithRelations> {
  const item = await prisma.menuItem.findUnique({
    where: { id },
    include: itemInclude(),
  });
  if (!item) {
    throw ApiError.notFound('Menu item not found');
  }
  return item;
}

export async function createItem(input: CreateMenuItemInput): Promise<MenuItemProfile> {
  await requireCategory(input.categoryId);

  const variations = input.variations ?? [];
  if (variations.length > 0) {
    const hasDefault = variations.some((variation) => variation.isDefault === true);
    if (!hasDefault) {
      variations[0].isDefault = true;
    }
  }

  const item = await prisma.menuItem.create({
    data: {
      name: input.name,
      price: input.price,
      sku: input.sku ?? null,
      categoryId: input.categoryId,
      taxRate: input.taxRate ?? '0',
      preparationTime: input.preparationTime ?? null,
      available: input.available ?? true,
      imageUrl: input.imageUrl ?? null,
      position: input.position ?? 0,
      variations: variations.length
        ? { create: variations.map((variation) => ({ name: variation.name, priceAdjustment: variation.priceAdjustment ?? '0', isDefault: variation.isDefault ?? false })) }
        : undefined,
      addOns: input.addOns?.length
        ? { create: input.addOns.map((addOn) => ({ name: addOn.name, price: addOn.price, available: addOn.available ?? true })) }
        : undefined,
    },
    include: itemInclude(),
  });
  return toItem(item);
}

export async function updateItem(
  id: string,
  input: UpdateMenuItemInput,
): Promise<MenuItemProfile> {
  await requireItem(id);
  if (input.categoryId) {
    await requireCategory(input.categoryId);
  }
  const item = await prisma.menuItem.update({
    where: { id },
    data: input,
    include: itemInclude(),
  });
  return toItem(item);
}

export async function deleteItem(id: string): Promise<void> {
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) {
    throw ApiError.notFound('Menu item not found');
  }
  const usedCount = await prisma.orderItem.count({ where: { menuItemId: id } });
  if (usedCount > 0) {
    throw ApiError.conflict('This item appears on past orders and cannot be deleted. Deactivate it instead.');
  }
  await prisma.menuItem.delete({ where: { id } });
}

// ---- Variations ----------------------------------------------

export async function createVariation(
  itemId: string,
  input: CreateVariationInput,
): Promise<MenuItemVariationProfile> {
  await requireItem(itemId);
  const variation = await prisma.menuItemVariation.create({
    data: {
      menuItemId: itemId,
      name: input.name,
      priceAdjustment: input.priceAdjustment ?? '0',
      isDefault: input.isDefault ?? false,
    },
  });
  if (input.isDefault) {
    await prisma.$transaction([
      prisma.menuItemVariation.updateMany({
        where: { menuItemId: itemId, id: { not: variation.id } },
        data: { isDefault: false },
      }),
      prisma.menuItemVariation.update({ where: { id: variation.id }, data: { isDefault: true } }),
    ]);
  }
  return toVariation(variation);
}

export async function updateVariation(
  id: string,
  input: UpdateVariationInput,
): Promise<MenuItemVariationProfile> {
  const existing = await prisma.menuItemVariation.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Variation not found');
  }
  if (input.isDefault === true) {
    await prisma.$transaction([
      prisma.menuItemVariation.updateMany({
        where: { menuItemId: existing.menuItemId, id: { not: id } },
        data: { isDefault: false },
      }),
      prisma.menuItemVariation.update({ where: { id }, data: { ...input, isDefault: true } }),
    ]);
  } else {
    await prisma.menuItemVariation.update({ where: { id }, data: input });
  }
  const variation = await prisma.menuItemVariation.findUniqueOrThrow({ where: { id } });
  return toVariation(variation);
}

export async function deleteVariation(id: string): Promise<void> {
  const existing = await prisma.menuItemVariation.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Variation not found');
  }
  if (existing.isDefault) {
    throw ApiError.conflict('The default variation cannot be deleted. Make another variation default first.');
  }
  await prisma.menuItemVariation.delete({ where: { id } });
}

// ---- Add-ons ------------------------------------------------

export async function createAddOn(itemId: string, input: CreateAddOnInput): Promise<MenuAddOnProfile> {
  await requireItem(itemId);
  const addOn = await prisma.addOn.create({
    data: {
      menuItemId: itemId,
      name: input.name,
      price: input.price,
      available: input.available ?? true,
    },
  });
  return toAddOn(addOn);
}

export async function updateAddOn(id: string, input: UpdateAddOnInput): Promise<MenuAddOnProfile> {
  const existing = await prisma.addOn.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Add-on not found');
  }
  const addOn = await prisma.addOn.update({ where: { id }, data: input });
  return toAddOn(addOn);
}

export async function deleteAddOn(id: string): Promise<void> {
  const existing = await prisma.addOn.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Add-on not found');
  }
  await prisma.addOn.delete({ where: { id } });
}