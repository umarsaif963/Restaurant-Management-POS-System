/**
 * Multi-tenancy, onboarding and role-management contracts shared by the
 * public website, the restaurant workspace and the platform console.
 */

import type { Permission, UserRole } from './permissions.js';

export const RESTAURANT_STATUSES = ['PENDING', 'ACTIVE', 'SUSPENDED'] as const;
export type RestaurantStatus = (typeof RESTAURANT_STATUSES)[number];

/**
 * Subscription tiers. The platform currently uses them for presentation and
 * for the plan shown on a restaurant record; no payment provider is wired up,
 * so a plan is never billed automatically.
 */
export const SUBSCRIPTION_PLANS = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'] as const;
export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export interface SubscriptionPlanProfile {
  id: SubscriptionPlan;
  name: string;
  priceLabel: string;
  priceNote: string;
  description: string;
  features: string[];
  highlighted: boolean;
  /** Marketing page only — the platform does not process payments yet. */
  ctaLabel: string;
}

export const SUBSCRIPTION_PLAN_CATALOG: readonly SubscriptionPlanProfile[] = [
  {
    id: 'STARTER',
    name: 'Starter',
    priceLabel: '$29',
    priceNote: 'per month, billed manually by our team',
    description: 'Everything a single-location restaurant needs to run its counter.',
    features: [
      'Point of sale & order management',
      'Menu, categories and pricing',
      'Kitchen display and tickets',
      'Table management',
      'Up to 5 employees',
      'Daily sales reports',
    ],
    highlighted: false,
    ctaLabel: 'Start with Starter',
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional',
    priceLabel: '$79',
    priceNote: 'per month, billed manually by our team',
    description: 'Full inventory, purchasing and analytics for busy venues.',
    features: [
      'Everything in Starter',
      'Inventory, recipes and stock movements',
      'Suppliers and purchase orders',
      'Advanced sales and payment analytics',
      'Reservations and customer records',
      'Unlimited employees',
    ],
    highlighted: true,
    ctaLabel: 'Choose Professional',
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    priceLabel: 'Custom',
    priceNote: 'talk to our team',
    description: 'For groups running several concepts and large teams.',
    features: [
      'Everything in Professional',
      'Unlimited employees and custom roles',
      'Priority support',
      'Guided onboarding',
      'Data migration assistance',
    ],
    highlighted: false,
    ctaLabel: 'Contact sales',
  },
];

// ---------------------------------------------------------------------------
// Public registration
// ---------------------------------------------------------------------------

export interface RegisterRestaurantInput {
  restaurantName: string;
  ownerName: string;
  email: string;
  phone?: string | null;
  password: string;
  confirmPassword: string;
  address?: string | null;
  currency?: string;
}

export interface RegisterRestaurantResponse {
  user: AuthUser;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    status: RestaurantStatus;
    plan: SubscriptionPlan;
  };
}

// ---------------------------------------------------------------------------
// Tenant identity carried by the signed-in user
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  /** `null` only for the platform super admin, who is not tied to a venue. */
  restaurantId: string | null;
  restaurantName: string | null;
  restaurantSlug: string | null;
  permissions: Permission[];
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

// ---------------------------------------------------------------------------
// Employee management
// ---------------------------------------------------------------------------

export interface EmployeeProfile extends AuthUser {
  /** Slug of the custom role attached to this employee, when any. */
  customRoleId: string | null;
  customRoleName: string | null;
  /** Individual permissions granted on top of the role. */
  extraPermissions: Permission[];
  /** Individual permissions revoked from the role. */
  restrictedPermissions: Permission[];
  /** True when the account was created with a temporary password. */
  mustChangePassword: boolean;
  /** Set for the last login, useful for the account-status column. */
  invitedByName: string | null;
}

export interface CreateEmployeeInput {
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  /** Optional custom role that defines the exact permission set. */
  customRoleId?: string | null;
  /** Individual permissions granted on top of the role. */
  extraPermissions?: Permission[];
  /** Individual permissions revoked from the role. */
  restrictedPermissions?: Permission[];
  /** Leave empty to have the server generate a secure temporary password. */
  password?: string;
}

export interface UpdateEmployeeInput {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: UserRole;
  customRoleId?: string | null;
  extraPermissions?: Permission[];
  restrictedPermissions?: Permission[];
  status?: UserStatus;
}

export interface ListEmployeesQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

/** Result of creating an employee; the temporary password is only present
 *  when the server generated it. */
export interface CreateEmployeeResult {
  employee: EmployeeProfile;
  temporaryPassword?: string;
}

/** Result of issuing a fresh temporary password for an employee. */
export interface ResetEmployeePasswordResult {
  temporaryPassword: string;
}

// ---------------------------------------------------------------------------
// Custom roles
// ---------------------------------------------------------------------------

export interface RoleProfile {
  id: string;
  restaurantId: string;
  name: string;
  slug: string;
  description: string | null;
  permissions: Permission[];
  isSystem: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleInput {
  name: string;
  description?: string | null;
  permissions: Permission[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
  permissions?: Permission[];
}

// ---------------------------------------------------------------------------
// Platform administration
// ---------------------------------------------------------------------------

export interface PlatformRestaurantProfile {
  id: string;
  name: string;
  slug: string;
  status: RestaurantStatus;
  plan: SubscriptionPlan;
  email: string | null;
  phone: string | null;
  address: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  employeeCount: number;
  orderCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformStats {
  totalRestaurants: number;
  activeRestaurants: number;
  suspendedRestaurants: number;
  totalUsers: number;
  totalOrders: number;
  restaurants: PlatformRestaurantProfile[];
}

export interface UpdatePlatformRestaurantInput {
  status?: RestaurantStatus;
  plan?: SubscriptionPlan;
  name?: string;
}
