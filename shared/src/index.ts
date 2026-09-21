/**
 * Shared, framework-agnostic types for the Restaurant Management & POS System.
 * Imported by both the Express server and the React client.
 */

export type Environment = 'development' | 'test' | 'production';

export interface ApiErrorItem {
  field?: string;
  message: string;
}

/**
 * Standard response envelope used by every API endpoint.
 */
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: ApiErrorItem[];
}

export interface HealthResponse {
  status: 'ok';
  service: string;
  version: string;
  environment: Environment;
  uptime: number;
  timestamp: string;
  database: 'connected' | 'unreachable' | 'configured' | 'not-configured';
}

// ---------------------------------------------------------------------------
// Identity & users (module 3)
// ---------------------------------------------------------------------------

export const USER_ROLES = ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER', 'KITCHEN_STAFF'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

/**
 * Sanitized user record. The password hash is never exposed.
 */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ---- Auth DTOs ------------------------------------------------

export interface AuthSessionData {
  user: AuthUser;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// ---- User management DTOs --------------------------------------

export interface CreateUserInput {
  name: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  phone?: string | null;
  role?: UserRole;
  password?: string;
}

export interface ListUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: UserRole;
  status?: UserStatus;
}

// ---------------------------------------------------------------------------
// Restaurant settings, tables & customers (module 4)
// ---------------------------------------------------------------------------

// ---- Tables -------------------------------------------------

export const TABLE_STATUSES = ['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING'] as const;
export type TableStatus = (typeof TABLE_STATUSES)[number];

export interface TableSectionProfile {
  id: string;
  name: string;
  position: number;
  tableCount: number;
}

export interface CreateTableSectionInput {
  name: string;
  position?: number;
}

export interface UpdateTableSectionInput {
  name?: string;
  position?: number;
}

export interface RestaurantTableProfile {
  id: string;
  tableNumber: number;
  name: string | null;
  capacity: number;
  sectionId: string | null;
  sectionName: string | null;
  status: TableStatus;
  qrCodeUrl: string | null;
}

export interface CreateTableInput {
  tableNumber: number;
  name?: string | null;
  capacity?: number;
  sectionId?: string | null;
}

export interface UpdateTableInput {
  tableNumber?: number;
  name?: string | null;
  capacity?: number;
  sectionId?: string | null;
  status?: TableStatus;
}

export interface ListTablesQuery {
  status?: TableStatus;
  sectionId?: string;
}

// ---- Settings ------------------------------------------------

export interface RestaurantProfile {
  id: string;
  name: string;
  logoUrl: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  currency: string;
  taxPercentage: string;
  serviceChargePct: string;
  isActive: boolean;
}

export interface RestaurantSettingsProfile {
  id: string;
  currency: string;
  taxPercentage: string;
  serviceChargePct: string;
  receiptHeader: string | null;
  receiptFooter: string | null;
  orderNumberPrefix: string;
  orderNumberStart: number;
  openingHours: Record<string, string> | null;
  showTaxOnReceipt: boolean;
  showServiceChargeOnReceipt: boolean;
}

export interface SettingsView {
  restaurant: RestaurantProfile;
  settings: RestaurantSettingsProfile;
}

export interface UpdateRestaurantInput {
  name?: string;
  logoUrl?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  currency?: string;
  taxPercentage?: string;
  serviceChargePct?: string;
}

export interface UpdateRestaurantSettingsInput {
  currency?: string;
  taxPercentage?: string;
  serviceChargePct?: string;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  orderNumberPrefix?: string;
  showTaxOnReceipt?: boolean;
  showServiceChargeOnReceipt?: boolean;
  openingHours?: Record<string, string> | null;
}

export interface UpdateSettingsInput {
  restaurant?: UpdateRestaurantInput;
  settings?: UpdateRestaurantSettingsInput;
}

// ---- Customers -----------------------------------------------

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  totalOrders: number;
  totalSpending: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface UpdateCustomerInput {
  name?: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface ListCustomersQuery {
  page?: number;
  limit?: number;
  search?: string;
}