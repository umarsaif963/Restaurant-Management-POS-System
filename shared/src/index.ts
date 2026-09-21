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