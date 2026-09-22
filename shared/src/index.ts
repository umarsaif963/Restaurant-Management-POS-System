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

// ---------------------------------------------------------------------------
// Menu (module 5)
// ---------------------------------------------------------------------------

export const MENU_ITEM_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type MenuItemStatus = (typeof MENU_ITEM_STATUSES)[number];

export interface MenuCategoryProfile {
  id: string;
  name: string;
  description: string | null;
  position: number;
  status: MenuItemStatus;
  itemCount: number;
}

export interface CreateMenuCategoryInput {
  name: string;
  description?: string | null;
  position?: number;
}

export interface UpdateMenuCategoryInput {
  name?: string;
  description?: string | null;
  position?: number;
  status?: MenuItemStatus;
}

export interface MenuItemVariationProfile {
  id: string;
  menuItemId: string;
  name: string;
  priceAdjustment: string;
  isDefault: boolean;
  createdAt: string;
}

export interface MenuAddOnProfile {
  id: string;
  menuItemId: string;
  name: string;
  price: string;
  available: boolean;
  createdAt: string;
}

export interface MenuItemProfile {
  id: string;
  name: string;
  description: string | null;
  price: string;
  sku: string | null;
  categoryId: string;
  categoryName: string;
  taxRate: string;
  preparationTime: number | null;
  available: boolean;
  imageUrl: string | null;
  position: number;
  status: MenuItemStatus;
  createdAt: string;
  updatedAt: string;
  variations: MenuItemVariationProfile[];
  addOns: MenuAddOnProfile[];
}

export interface CreateVariationInput {
  name: string;
  priceAdjustment?: string;
  isDefault?: boolean;
}

export interface UpdateVariationInput {
  name?: string;
  priceAdjustment?: string;
  isDefault?: boolean;
}

export interface CreateAddOnInput {
  name: string;
  price: string;
  available?: boolean;
}

export interface UpdateAddOnInput {
  name?: string;
  price?: string;
  available?: boolean;
}

export interface CreateMenuItemInput {
  name: string;
  price: string;
  categoryId: string;
  sku?: string | null;
  description?: string | null;
  taxRate?: string;
  preparationTime?: number | null;
  available?: boolean;
  imageUrl?: string | null;
  position?: number;
  variations?: CreateVariationInput[];
  addOns?: CreateAddOnInput[];
}

export interface UpdateMenuItemInput {
  name?: string;
  price?: string;
  categoryId?: string;
  sku?: string | null;
  description?: string | null;
  taxRate?: string;
  preparationTime?: number | null;
  available?: boolean;
  imageUrl?: string | null;
  position?: number;
  status?: MenuItemStatus;
}

export interface ListMenuItemsQuery {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  status?: MenuItemStatus;
}

// ---------------------------------------------------------------------------
// Orders (module 6)
// ---------------------------------------------------------------------------

export const ORDER_TYPES = ['DINE_IN', 'TAKEAWAY', 'DELIVERY'] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = ['UNPAID', 'PARTIAL', 'PAID', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export interface OrderAddOnSnapshot {
  name: string;
  price: string;
}

export interface OrderItemProfile {
  id: string;
  orderId: string;
  menuItemId: string;
  name: string;
  variationName: string | null;
  addOns: OrderAddOnSnapshot[] | null;
  quantity: number;
  unitPrice: string;
  lineTotal: string;
  discountAmount: string;
  taxAmount: string;
  notes: string | null;
  createdAt: string;
}

export interface OrderProfile {
  id: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerId: string | null;
  customerName: string | null;
  tableId: string | null;
  tableNumber: number | null;
  tableName: string | null;
  userId: string;
  userName: string;
  subtotal: string;
  itemDiscountTotal: string;
  discountAmount: string;
  taxAmount: string;
  serviceChargeAmount: string;
  grandTotal: string;
  totalPaid: string;
  balanceDue: string;
  notes: string | null;
  kitchenNotes: string | null;
  cancelledReason: string | null;
  completedAt: string | null;
  createdAt: string;
  items: OrderItemProfile[];
}

export interface CreateOrderItemInput {
  menuItemId: string;
  quantity?: number;
  variationId?: string;
  addOnIds?: string[];
  notes?: string;
}

export interface CreateOrderInput {
  orderType?: OrderType;
  tableId?: string | null;
  customerId?: string | null;
  notes?: string | null;
  kitchenNotes?: string | null;
  discountAmount?: string;
  items: CreateOrderItemInput[];
}

export interface AddOrderItemsInput {
  items: CreateOrderItemInput[];
}

export interface UpdateOrderInput {
  notes?: string | null;
  kitchenNotes?: string | null;
  customerId?: string | null;
  tableId?: string | null;
  orderType?: OrderType;
}

export interface UpdateOrderStatusInput {
  status: OrderStatus;
  cancelledReason?: string;
}

export interface ListOrdersQuery {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  orderType?: OrderType;
  search?: string;
}