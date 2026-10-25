/**
 * Granular permission catalogue and role defaults.
 *
 * The authorization model has two layers:
 *
 *  1. `UserRole` (ADMIN / MANAGER / CASHIER / WAITER / KITCHEN_STAFF) is the
 *     *job function* of an account and drives the default permission set.
 *  2. `Permission` is the fine-grained capability a request is checked
 *     against. A restaurant owner can attach a custom `Role` with an explicit
 *     permission list to an employee, and can additionally grant or revoke
 *     single permissions per employee.
 *
 * Platform permissions (`PLATFORM_*`) are reserved for the platform operator
 * and are never part of a restaurant role's default set. They can never be
 * granted through the public registration flow or through restaurant
 * employee management.
 */

export const PERMISSIONS = [
  // ---- Platform administration (operator only) ----------------------
  'PLATFORM_VIEW_RESTAURANTS',
  'PLATFORM_MANAGE_RESTAURANTS',
  'PLATFORM_VIEW_STATS',
  'PLATFORM_MANAGE_PLANS',
  'PLATFORM_MANAGE_SETTINGS',

  // ---- Point of sale & orders ---------------------------------------
  'POS_USE',
  'ORDERS_READ',
  'ORDERS_CREATE',
  'ORDERS_UPDATE',
  'ORDERS_CANCEL',
  'ORDERS_REFUND',
  'PAYMENTS_CREATE',
  'PAYMENTS_REFUND',
  'RECEIPTS_PRINT',

  // ---- Kitchen ------------------------------------------------------
  'KITCHEN_READ',
  'KITCHEN_UPDATE',
  'KDS_VIEW',

  // ---- Menu ---------------------------------------------------------
  'MENU_READ',
  'MENU_WRITE',

  // ---- Inventory ----------------------------------------------------
  'INVENTORY_READ',
  'INVENTORY_WRITE',
  'INVENTORY_TRANSACT',
  'RECIPES_READ',
  'RECIPES_WRITE',

  // ---- Supply chain --------------------------------------------------
  'SUPPLIERS_READ',
  'SUPPLIERS_WRITE',
  'PURCHASES_READ',
  'PURCHASES_WRITE',

  // ---- Floor & guests ------------------------------------------------
  'TABLES_READ',
  'TABLES_WRITE',
  'CUSTOMERS_READ',
  'CUSTOMERS_WRITE',
  'RESERVATIONS_READ',
  'RESERVATIONS_WRITE',

  // ---- Insights ------------------------------------------------------
  'DASHBOARD_VIEW',
  'REPORTS_VIEW',
  'AUDIT_LOGS_VIEW',

  // ---- Restaurant administration --------------------------------------
  'SETTINGS_READ',
  'SETTINGS_WRITE',
  'EMPLOYEES_READ',
  'EMPLOYEES_WRITE',
  'ROLES_READ',
  'ROLES_WRITE',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const PERMISSION_SET: ReadonlySet<string> = new Set(PERMISSIONS);

/** True when the value is a known permission. */
export function isPermission(value: string): value is Permission {
  return PERMISSION_SET.has(value);
}

/** Platform-only capabilities; never assignable inside a restaurant. */
export const PLATFORM_PERMISSIONS: readonly Permission[] = PERMISSIONS.filter(
  (permission) => permission.startsWith('PLATFORM_'),
);

/** Capabilities a restaurant role may hold. */
export const RESTAURANT_PERMISSIONS: readonly Permission[] = PERMISSIONS.filter(
  (permission) => !permission.startsWith('PLATFORM_'),
);

/** Every restaurant-level permission (the restaurant owner's full set). */
export const ALL_RESTAURANT_PERMISSIONS: readonly Permission[] = [...RESTAURANT_PERMISSIONS];

export const USER_ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'WAITER',
  'KITCHEN_STAFF',
] as const;
export type UserRole = (typeof USER_ROLES)[number];

/** Roles that live inside a restaurant workspace. */
export const RESTAURANT_USER_ROLES = [
  'ADMIN',
  'MANAGER',
  'CASHIER',
  'WAITER',
  'KITCHEN_STAFF',
] as const;
export type RestaurantUserRole = (typeof RESTAURANT_USER_ROLES)[number];

/** The platform operator role; never obtainable through public signup. */
export const PLATFORM_ROLES: readonly UserRole[] = ['SUPER_ADMIN'];

/** Roles that may not be assigned to an employee by a restaurant owner. */
export const NON_ASSIGNABLE_ROLES: readonly UserRole[] = ['SUPER_ADMIN'];

export function isRestaurantUserRole(role: string): role is RestaurantUserRole {
  return (RESTAURANT_USER_ROLES as readonly string[]).includes(role);
}

const MANAGER_PERMISSIONS: readonly Permission[] = [
  'POS_USE',
  'ORDERS_READ',
  'ORDERS_CREATE',
  'ORDERS_UPDATE',
  'ORDERS_CANCEL',
  'ORDERS_REFUND',
  'PAYMENTS_CREATE',
  'PAYMENTS_REFUND',
  'RECEIPTS_PRINT',
  'KITCHEN_READ',
  'KITCHEN_UPDATE',
  'KDS_VIEW',
  'MENU_READ',
  'MENU_WRITE',
  'INVENTORY_READ',
  'INVENTORY_TRANSACT',
  'RECIPES_READ',
  'SUPPLIERS_READ',
  'PURCHASES_READ',
  'TABLES_READ',
  'TABLES_WRITE',
  'CUSTOMERS_READ',
  'CUSTOMERS_WRITE',
  'RESERVATIONS_READ',
  'RESERVATIONS_WRITE',
  'DASHBOARD_VIEW',
  'REPORTS_VIEW',
  'EMPLOYEES_READ',
  'SETTINGS_READ',
];

const CASHIER_PERMISSIONS: readonly Permission[] = [
  'POS_USE',
  'ORDERS_READ',
  'ORDERS_CREATE',
  'ORDERS_UPDATE',
  'PAYMENTS_CREATE',
  'RECEIPTS_PRINT',
  'MENU_READ',
  'TABLES_READ',
  'CUSTOMERS_READ',
  'CUSTOMERS_WRITE',
];

const WAITER_PERMISSIONS: readonly Permission[] = [
  'POS_USE',
  'ORDERS_READ',
  'ORDERS_CREATE',
  'ORDERS_UPDATE',
  'RECEIPTS_PRINT',
  'MENU_READ',
  'TABLES_READ',
  'TABLES_WRITE',
  'CUSTOMERS_READ',
  'CUSTOMERS_WRITE',
  'RESERVATIONS_READ',
  'RESERVATIONS_WRITE',
];

const KITCHEN_STAFF_PERMISSIONS: readonly Permission[] = [
  'KITCHEN_READ',
  'KITCHEN_UPDATE',
  'KDS_VIEW',
  'MENU_READ',
  'ORDERS_READ',
];

/**
 * Default capability set per built-in role.
 *
 * `ADMIN` (the restaurant owner) holds every restaurant permission.
 * `SUPER_ADMIN` (the platform operator) additionally holds the platform
 * permissions; it is never handed out by restaurant-facing endpoints.
 */
export const ROLE_DEFAULT_PERMISSIONS: Readonly<Record<UserRole, readonly Permission[]>> = {
  SUPER_ADMIN: [...PERMISSIONS],
  ADMIN: [...ALL_RESTAURANT_PERMISSIONS],
  MANAGER: [...MANAGER_PERMISSIONS],
  CASHIER: [...CASHIER_PERMISSIONS],
  WAITER: [...WAITER_PERMISSIONS],
  KITCHEN_STAFF: [...KITCHEN_STAFF_PERMISSIONS],
};

/** Human-readable labels for the employee management UI. */
export const PERMISSION_LABELS: Readonly<Record<Permission, string>> = {
  PLATFORM_VIEW_RESTAURANTS: 'View registered restaurants',
  PLATFORM_MANAGE_RESTAURANTS: 'Activate / suspend restaurants',
  PLATFORM_VIEW_STATS: 'View platform statistics',
  PLATFORM_MANAGE_PLANS: 'Manage subscription plans',
  PLATFORM_MANAGE_SETTINGS: 'Manage platform settings',
  POS_USE: 'Use the point of sale',
  ORDERS_READ: 'View orders',
  ORDERS_CREATE: 'Create orders',
  ORDERS_UPDATE: 'Update orders',
  ORDERS_CANCEL: 'Cancel orders',
  ORDERS_REFUND: 'Refund orders',
  PAYMENTS_CREATE: 'Take payments',
  PAYMENTS_REFUND: 'Issue refunds',
  RECEIPTS_PRINT: 'Print receipts',
  KITCHEN_READ: 'View kitchen tickets',
  KITCHEN_UPDATE: 'Update kitchen tickets',
  KDS_VIEW: 'Use the kitchen display',
  MENU_READ: 'View the menu',
  MENU_WRITE: 'Manage the menu',
  INVENTORY_READ: 'View inventory',
  INVENTORY_WRITE: 'Manage inventory items',
  INVENTORY_TRANSACT: 'Record stock movements',
  RECIPES_READ: 'View recipes',
  RECIPES_WRITE: 'Manage recipes',
  SUPPLIERS_READ: 'View suppliers',
  SUPPLIERS_WRITE: 'Manage suppliers',
  PURCHASES_READ: 'View purchase orders',
  PURCHASES_WRITE: 'Manage purchase orders',
  TABLES_READ: 'View tables',
  TABLES_WRITE: 'Manage tables',
  CUSTOMERS_READ: 'View customers',
  CUSTOMERS_WRITE: 'Manage customers',
  RESERVATIONS_READ: 'View reservations',
  RESERVATIONS_WRITE: 'Manage reservations',
  DASHBOARD_VIEW: 'View the dashboard',
  REPORTS_VIEW: 'View reports',
  AUDIT_LOGS_VIEW: 'View audit logs',
  SETTINGS_READ: 'View restaurant settings',
  SETTINGS_WRITE: 'Change restaurant settings',
  EMPLOYEES_READ: 'View employees',
  EMPLOYEES_WRITE: 'Create and manage employees',
  ROLES_READ: 'View roles',
  ROLES_WRITE: 'Create and manage roles',
};

/**
 * Resolve the effective permission set of an account.
 *
 * Resolution order:
 *  1. Built-in role defaults.
 *  2. A custom role attached to the account replaces the defaults entirely,
 *     so an owner has exact control over what a custom role may do.
 *  3. Explicit per-account grants are added.
 *  4. Explicit per-account revocations are removed.
 */
export function resolvePermissions(params: {
  role: UserRole;
  customRolePermissions?: readonly Permission[] | null;
  extraPermissions?: readonly Permission[] | null;
  restrictedPermissions?: readonly Permission[] | null;
}): Permission[] {
  const base =
    params.customRolePermissions && params.customRolePermissions.length > 0
      ? [...params.customRolePermissions]
      : [...(ROLE_DEFAULT_PERMISSIONS[params.role] ?? [])];

  const granted = new Set(base);
  for (const permission of params.extraPermissions ?? []) {
    granted.add(permission);
  }
  for (const permission of params.restrictedPermissions ?? []) {
    granted.delete(permission);
  }
  return PERMISSIONS.filter((permission) => granted.has(permission));
}

/** True when the resolved set contains the permission. */
export function hasPermission(
  permissions: readonly Permission[] | undefined,
  permission: Permission,
): boolean {
  return !!permissions && permissions.includes(permission);
}

/** True when the resolved set contains every listed permission. */
export function hasAllPermissions(
  permissions: readonly Permission[] | undefined,
  required: readonly Permission[],
): boolean {
  if (!permissions) return false;
  return required.every((permission) => permissions.includes(permission));
}

/**
 * Strip platform permissions from a set that is about to be granted inside a
 * restaurant. Used by employee management so a crafted request can never
 * hand an employee platform-level powers.
 */
export function withoutPlatformPermissions(
  permissions: readonly Permission[],
): Permission[] {
  return permissions.filter((permission) => !permission.startsWith('PLATFORM_'));
}
