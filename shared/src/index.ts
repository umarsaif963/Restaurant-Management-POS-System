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

// ---------------------------------------------------------------------------
// Kitchen tickets (module 7)
// ---------------------------------------------------------------------------

export const KITCHEN_ORDER_STATUSES = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED', 'CANCELLED'] as const;
export type KitchenOrderStatus = (typeof KITCHEN_ORDER_STATUSES)[number];

export const KITCHEN_ITEM_STATUSES = ['WAITING', 'PREPARING', 'READY', 'SERVED', 'CANCELLED'] as const;
export type KitchenItemStatus = (typeof KITCHEN_ITEM_STATUSES)[number];

export interface KitchenOrderItemProfile {
  id: string;
  kitchenOrderId: string;
  orderItemId: string;
  menuItemId: string;
  name: string;
  quantity: number;
  notes: string | null;
  variant: string | null;
  status: KitchenItemStatus;
  createdAt: string;
}

export interface KitchenOrderProfile {
  id: string;
  orderId: string;
  orderNumber: string;
  ticketNumber: number;
  status: KitchenOrderStatus;
  orderType: OrderType;
  orderStatus: OrderStatus;
  tableId: string | null;
  tableNumber: number | null;
  tableName: string | null;
  customerName: string | null;
  notes: string | null;
  acceptedById: string | null;
  acceptedByName: string | null;
  startedAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  createdAt: string;
  items: KitchenOrderItemProfile[];
}

export interface ListKitchenOrdersQuery {
  page?: number;
  limit?: number;
  status?: KitchenOrderStatus;
  orderId?: string;
}

export interface UpdateKitchenOrderStatusInput {
  status: KitchenOrderStatus;
}

// ---------------------------------------------------------------------------
// Receipts (module 7)
// ---------------------------------------------------------------------------

export interface ReceiptView {
  order: OrderProfile;
  restaurantName: string;
  restaurantAddress: string | null;
  restaurantPhone: string | null;
  restaurantEmail: string | null;
  currency: string;
  receiptHeader: string | null;
  receiptFooter: string | null;
  showTaxOnReceipt: boolean;
  showServiceChargeOnReceipt: boolean;
  serviceChargePct: string;
  taxPercentage: string;
  payments: PaymentProfile[];
  printedAt: string;
}

// ---------------------------------------------------------------------------
// Payments & billing (module 9)
// ---------------------------------------------------------------------------

export const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface PaymentProfile {
  id: string;
  orderId: string;
  amount: string;
  method: PaymentMethod;
  transactionRef: string | null;
  receivedByName: string | null;
  changeDue: string | null;
  notes: string | null;
  isRefund: boolean;
  refundOfId: string | null;
  paidAt: string;
}

export interface RecordPaymentInput {
  amount: string;
  method: PaymentMethod;
  transactionRef?: string | null;
  notes?: string | null;
}

export interface RefundPaymentInput {
  amount: string;
  method?: PaymentMethod;
  transactionRef?: string | null;
  notes?: string | null;
}

export interface PaymentRecordResult {
  payment: PaymentProfile;
  order: OrderProfile;
}

export interface PaymentRefundResult {
  refund: PaymentProfile;
  order: OrderProfile;
}

// ---------------------------------------------------------------------------
// Real-time events (module 8)
// ---------------------------------------------------------------------------

/**
 * Server -> client Socket.IO channels. Services publish domain events on an
 * in-process bus and the socket layer forwards them to every connected
 * client; the client invalidates the matching RTK Query tags so subscribed
 * views (orders, kitchen display, tables, customers) refetch instantly.
 */
export const SOCKET_EVENTS = {
  orderUpdated: 'order:updated',
  kitchenCreated: 'kitchen:created',
  kitchenUpdated: 'kitchen:updated',
  tableUpdated: 'table:updated',
  customerUpdated: 'customer:updated',
  inventoryUpdated: 'inventory:updated',
} as const;

export type SocketEventName = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];

export interface OrderUpdatedPayload {
  orderId: string;
}

export interface KitchenCreatedPayload {
  orderId: string;
}

export interface KitchenUpdatedPayload {
  kitchenOrderId?: string;
  orderId: string;
}

export interface TableUpdatedPayload {
  tableId?: string;
}

export interface CustomerUpdatedPayload {
  customerId?: string;
}

/**
 * Fired after an order-level stock movement (consumption or reversal).
 * Clients invalidate the whole inventory cache because a single event can
 * touch several line items at once.
 */
export interface InventoryUpdatedPayload {
  orderId?: string;
}

// ---------------------------------------------------------------------------
// Inventory, recipes & ingredients (module 10)
// ---------------------------------------------------------------------------

export const STOCK_UNITS = ['KG', 'GRAM', 'LITER', 'ML', 'PIECE', 'PACK'] as const;
export type StockUnit = (typeof STOCK_UNITS)[number];

export const INVENTORY_TRANSACTION_TYPES = [
  'PURCHASE',
  'SALE',
  'ADJUSTMENT',
  'WASTAGE',
  'DAMAGE',
  'RETURN',
  'ORDER_CANCEL',
] as const;
export type InventoryTransactionType = (typeof INVENTORY_TRANSACTION_TYPES)[number];

/** Derived stock health, computed client + server side from quantity vs min. */
export type StockHealth = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryItemProfile {
  id: string;
  name: string;
  sku: string | null;
  unit: StockUnit;
  quantity: string;
  minQuantity: string;
  costPrice: string;
  category: string | null;
  supplierName: string | null;
  expiryDate: string | null;
  isActive: boolean;
  health: StockHealth;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryTransactionProfile {
  id: string;
  inventoryItemId: string;
  itemName: string;
  type: InventoryTransactionType;
  quantity: string;
  balanceAfter: string | null;
  unitCost: string | null;
  note: string | null;
  referenceIds: string | null;
  /** Order that triggered the movement, when the movement is order-based. */
  order: { id: string; orderNumber: string } | null;
  userName: string | null;
  createdAt: string;
}

export interface RecipeIngredientProfile {
  id: string;
  inventoryItemId: string;
  itemName: string;
  unit: StockUnit;
  quantity: string;
  costPrice: string;
  lineCost: string;
}

export interface RecipeProfile {
  id: string;
  menuItemId: string;
  menuItemName: string;
  menuItemPrice: string;
  name: string;
  yield: number;
  totalCost: string;
  costPerUnit: string;
  hasIngredients: boolean;
  ingredients: RecipeIngredientProfile[];
  createdAt: string;
  updatedAt: string;
}

// ---- Inputs ----

export interface ReorderSuggestionItem {
  item: InventoryItemProfile;
  /** Units consumed per day (net of returns) over the lookback window. */
  consumptionPerDay: string;
  /** Days of stock left at current velocity, or '0' when out; null if no velocity data yet. */
  daysOfStock: string | null;
  /** Cover needed: velocity × lead days + the item's minimum buffer. */
  projectedNeed: string;
  /** Suggested purchase quantity: max(0, projectedNeed − on hand). */
  suggestedQuantity: string;
}

export interface ReorderSuggestions {
  generatedAt: string;
  windowDays: number;
  leadDays: number;
  items: ReorderSuggestionItem[];
}

export interface ReorderSuggestionsQuery {
  windowDays?: number;
  leadDays?: number;
}

export interface CreateInventoryItemInput {
  name: string;
  sku?: string | null;
  unit: StockUnit;
  quantity?: string;
  minQuantity?: string;
  costPrice?: string;
  category?: string | null;
  expiryDate?: string | null;
  isActive?: boolean;
}

export interface UpdateInventoryItemInput {
  name?: string;
  sku?: string | null;
  unit?: StockUnit;
  minQuantity?: string;
  costPrice?: string;
  category?: string | null;
  expiryDate?: string | null;
  isActive?: boolean;
}

/**
 * A stock movement against an inventory item. `quantity` is the number of
 * units moved (always positive); the type decides the direction added to the
 * balance (PURCHASE/RETURN/ORDER_CANCEL increase, SALE/WASTAGE/DAMAGE
 * decrease, ADJUSTMENT is an explicit signed set of the new balance instead).
 */
export interface RecordInventoryTransactionInput {
  type: InventoryTransactionType;
  quantity?: string;
  note?: string | null;
  unitCost?: string;
}

export interface CreateRecipeInput {
  menuItemId: string;
  name: string;
  yield?: number;
  ingredients: { inventoryItemId: string; quantity: string }[];
}

export interface UpdateRecipeInput {
  name?: string;
  yield?: number;
  ingredients?: { inventoryItemId: string; quantity: string }[];
}

// ---- Queries ----

export interface ListInventoryItemsQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  health?: StockHealth;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ListInventoryTransactionsQuery {
  itemId?: string;
  type?: InventoryTransactionType;
  page?: number;
  limit?: number;
}

export interface ListRecipesQuery {
  page?: number;
  limit?: number;
  search?: string;
}

// ===========================================================================
// Module 11 — Suppliers & purchases
// ===========================================================================

export const PURCHASE_STATUSES = ['PENDING', 'RECEIVED', 'CANCELLED'] as const;
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];

export interface SupplierProfile {
  id: string;
  name: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  purchaseCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItemProfile {
  id: string;
  inventoryItemId: string;
  itemName: string;
  unit: StockUnit;
  quantity: string;
  unitCost: string;
  amount: string;
}

export interface PurchaseProfile {
  id: string;
  purchaseNumber: string;
  supplierId: string;
  supplierName: string;
  status: PurchaseStatus;
  totalAmount: string;
  notes: string | null;
  receivedAt: string | null;
  items: PurchaseItemProfile[];
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierInput {
  name: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface UpdateSupplierInput {
  name?: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  notes?: string | null;
}

export interface CreatePurchaseInput {
  supplierId: string;
  notes?: string | null;
  items: { inventoryItemId: string; quantity: string; unitCost: string }[];
}

export interface UpdatePurchaseInput {
  notes?: string | null;
  items?: { inventoryItemId: string; quantity: string; unitCost: string }[];
}

export interface ChangePurchaseStatusInput {
  status: Extract<PurchaseStatus, 'RECEIVED' | 'CANCELLED'>;
}

export interface ListSuppliersQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListPurchasesQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: PurchaseStatus;
}

// ===========================================================================
// Module 12 — Reservations
// ===========================================================================

export const RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELLED'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export interface ReservationProfile {
  id: string;
  customerName: string;
  phone: string | null;
  customerId: string | null;
  customerEmail: string | null;
  tableId: string | null;
  tableNumber: number | null;
  tableName: string | null;
  capacity: number | null;
  guests: number;
  date: string;
  notes: string | null;
  status: ReservationStatus;
  createdById: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReservationInput {
  customerName: string;
  phone?: string | null;
  customerId?: string | null;
  tableId?: string | null;
  guests: number;
  date: string;
  notes?: string | null;
}

export interface UpdateReservationInput {
  customerName?: string;
  phone?: string | null;
  customerId?: string | null;
  tableId?: string | null;
  guests?: number;
  date?: string;
  notes?: string | null;
}

export interface ChangeReservationStatusInput {
  status: Extract<ReservationStatus, 'CONFIRMED' | 'SEATED' | 'COMPLETED' | 'CANCELLED'>;
}

export interface ListReservationsQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: ReservationStatus;
  /** Inclusive lower bound (ISO datetime) for the reservation date. */
  from?: string;
  /** Inclusive upper bound (ISO datetime) for the reservation date. */
  to?: string;
}

// Module 13 — Dashboard & analytics
// ===========================================================================

/** Money amounts are decimal strings with 2 places. Day buckets are UTC. */
export interface DashboardSummary {
  today: {
    /** Revenue recognized on orders completed today. */
    revenue: string;
    /** Orders created today (any non-cancelled status). */
    orders: number;
    /** Orders completed today. */
    completedOrders: number;
    averageOrderValue: string;
    /** Orders created today still open (not COMPLETED/CANCELLED). */
    openOrders: number;
  };
  tables: {
    total: number;
    available: number;
    reserved: number;
    occupied: number;
    cleaning: number;
  };
  inventory: {
    lowStock: number;
    outOfStock: number;
  };
  reservations: {
    /** Active (PENDING/CONFIRMED/SEATED) bookings for today. */
    today: number;
    /** Active bookings dated later than today. */
    upcoming: number;
  };
  paymentsToday: {
    /** Non-refund minus refund totals recorded today. */
    netReceived: string;
    count: number;
  };
}

export interface SalesByDayItem {
  date: string;
  orders: number;
  revenue: string;
  averageOrderValue: string;
}

export interface SalesReport {
  from: string;
  to: string;
  items: SalesByDayItem[];
}

export interface TopSellingItem {
  menuItemId: string;
  name: string;
  quantity: number;
  revenue: string;
  orders: number;
}

export interface TopSellingReport {
  items: TopSellingItem[];
}

export interface PaymentMethodBreakdownItem {
  method: PaymentMethod;
  amount: string;
  count: number;
}

export interface PaymentMethodReport {
  total: string;
  items: PaymentMethodBreakdownItem[];
}

export interface OrderStatusCount {
  status: OrderStatus;
  count: number;
}

export interface OrderTypeCount {
  type: OrderType;
  count: number;
  revenue: string;
}

export interface OrderAnalyticsReport {
  statuses: OrderStatusCount[];
  types: OrderTypeCount[];
}

/** Inclusive ISO-datetime range; when omitted the service applies defaults. */
export interface AnalyticsRangeQuery {
  from?: string;
  to?: string;
}

export interface TopItemsQuery extends AnalyticsRangeQuery {
  limit?: number;
}

// Module 14 — Audit logs & security
// ===========================================================================

/**
 * Audit entry describing a request that reached the API. HTTP-captured rows
 * carry `entity: 'HTTP'` and effort to the request in `metadata`; seeded rows
 * use semantic action/entity pairs (e.g. `order.create` / `order`).
 */
export interface AuditLogProfile {
  id: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  action: string;
  entity: string;
  entityId: string | null;
  /** HTTP verb, when the row came from request capture. */
  method: string;
  /** Request path, when the row came from request capture. */
  path: string;
  /** Response status code, when captured. */
  status: number | null;
  /** Handler duration in milliseconds, when captured. */
  durationMs: number | null;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
}

export interface ListAuditLogsQuery {
  page?: number;
  limit?: number;
  /** Free text across action, entity, and actor name/email. */
  search?: string;
  entity?: string;
  method?: string;
  status?: number;
  /** Inclusive lower bound (ISO datetime) on `createdAt`. */
  from?: string;
  /** Inclusive upper bound (ISO datetime) on `createdAt`. */
  to?: string;
  sort?: 'asc' | 'desc';
}

export interface PurgeAuditLogsInput {
  /** Delete entries older than this many days (1–365). */
  olderThanDays: number;
}

export interface PurgeAuditLogsResult {
  deleted: number;
}