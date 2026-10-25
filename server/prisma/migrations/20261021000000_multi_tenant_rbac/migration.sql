-- ---------------------------------------------------------------------------
-- Multi-tenant + role based access control
--
-- This migration converts the single-restaurant POS into a multi-tenant
-- platform. It is written to be NON-DESTRUCTIVE:
--
--   * No table is dropped and no row is deleted.
--   * Every existing record is adopted by one "legacy" restaurant (the
--     existing Restaurant row when there is one, otherwise a freshly created
--     placeholder) so no operational history is lost.
--   * Tenant-scoped unique keys become COMPOSITE (restaurantId, <key>) so two
--     restaurants may reuse the same table number / SKU / order number.
--   * A CHECK constraint guarantees the role <-> tenant invariant: only the
--     platform super admin may exist without a restaurant, and every other
--     account must belong to exactly one restaurant.
--
-- Rollback: see ./down.sql in this folder.
-- ---------------------------------------------------------------------------

-- CreateEnum
CREATE TYPE "RestaurantStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SubscriptionPlan" AS ENUM ('STARTER', 'PROFESSIONAL', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "Permission" AS ENUM ('PLATFORM_VIEW_RESTAURANTS', 'PLATFORM_MANAGE_RESTAURANTS', 'PLATFORM_VIEW_STATS', 'PLATFORM_MANAGE_PLANS', 'PLATFORM_MANAGE_SETTINGS', 'POS_USE', 'ORDERS_READ', 'ORDERS_CREATE', 'ORDERS_UPDATE', 'ORDERS_CANCEL', 'ORDERS_REFUND', 'PAYMENTS_CREATE', 'PAYMENTS_REFUND', 'RECEIPTS_PRINT', 'KITCHEN_READ', 'KITCHEN_UPDATE', 'KDS_VIEW', 'MENU_READ', 'MENU_WRITE', 'INVENTORY_READ', 'INVENTORY_WRITE', 'INVENTORY_TRANSACT', 'RECIPES_READ', 'RECIPES_WRITE', 'SUPPLIERS_READ', 'SUPPLIERS_WRITE', 'PURCHASES_READ', 'PURCHASES_WRITE', 'TABLES_READ', 'TABLES_WRITE', 'CUSTOMERS_READ', 'CUSTOMERS_WRITE', 'RESERVATIONS_READ', 'RESERVATIONS_WRITE', 'DASHBOARD_VIEW', 'REPORTS_VIEW', 'AUDIT_LOGS_VIEW', 'SETTINGS_READ', 'SETTINGS_WRITE', 'EMPLOYEES_READ', 'EMPLOYEES_WRITE', 'ROLES_READ', 'ROLES_WRITE');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'SUPER_ADMIN';

-- ---------------------------------------------------------------------------
-- 1) Restaurant: new columns (nullable first, backfilled before NOT NULL)
-- ---------------------------------------------------------------------------

ALTER TABLE "Restaurant"
  ADD COLUMN "slug" TEXT,
  ADD COLUMN "status" "RestaurantStatus",
  ADD COLUMN "plan" "SubscriptionPlan",
  ADD COLUMN "ownerId" TEXT;

UPDATE "Restaurant"
SET "slug" = COALESCE(
      NULLIF(lower(regexp_replace("name", '[^a-zA-Z0-9]+', '-', 'g')), ''),
      'restaurant'
    ) || '-' || substr("id", 1, 6)
WHERE "slug" IS NULL;

UPDATE "Restaurant" SET "status" = 'ACTIVE' WHERE "status" IS NULL;
UPDATE "Restaurant" SET "plan" = 'STARTER' WHERE "plan" IS NULL;

-- Guarantee at least one tenant exists so the backfill below always has a
-- parent row for the pre-existing data.
DO $$
DECLARE
  legacy_id TEXT;
BEGIN
  SELECT "id" INTO legacy_id FROM "Restaurant" ORDER BY "createdAt" ASC LIMIT 1;

  IF legacy_id IS NULL THEN
    INSERT INTO "Restaurant"
      ("id", "name", "slug", "currency", "taxPercentage", "serviceChargePct",
       "isActive", "status", "plan", "createdAt", "updatedAt")
    VALUES
      ('legacy-restaurant', 'Legacy Restaurant', 'legacy-restaurant', 'USD', 0, 0,
       true, 'ACTIVE', 'STARTER', NOW(), NOW());
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- 2) Tenant key on every operational table
-- ---------------------------------------------------------------------------

ALTER TABLE "TableSection" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "RestaurantTable" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "Customer" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "MenuCategory" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "MenuItem" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "MenuItemVariation" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "AddOn" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "Order" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "Payment" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "KitchenOrder" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "KitchenOrderItem" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "Reservation" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "InventoryItem" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "InventoryTransaction" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "Recipe" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "RecipeIngredient" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "Supplier" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "Purchase" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "PurchaseItem" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "User" ADD COLUMN "restaurantId" TEXT;

-- Adopt every pre-existing row into the legacy tenant.
DO $$
DECLARE
  legacy_id TEXT;
BEGIN
  SELECT "id" INTO legacy_id FROM "Restaurant" ORDER BY "createdAt" ASC LIMIT 1;

  UPDATE "TableSection" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "RestaurantTable" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "Customer" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "MenuCategory" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "MenuItem" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "MenuItemVariation" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "AddOn" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "Order" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "OrderItem" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "Payment" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "KitchenOrder" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "KitchenOrderItem" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "Reservation" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "InventoryItem" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "InventoryTransaction" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "Recipe" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "RecipeIngredient" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "Supplier" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "Purchase" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;
  UPDATE "PurchaseItem" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;

  -- Every pre-existing account belongs to the legacy tenant. No platform
  -- super admin exists yet, so the role/tenant CHECK below stays satisfied.
  UPDATE "User" SET "restaurantId" = legacy_id WHERE "restaurantId" IS NULL;

  -- Audit entries inherit the tenant of the actor that produced them.
  UPDATE "AuditLog" AS a
     SET "restaurantId" = u."restaurantId"
    FROM "User" AS u
   WHERE u."id" = a."userId" AND a."restaurantId" IS NULL;
END $$;

-- The operational tables must now always carry a tenant.
ALTER TABLE "TableSection" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "RestaurantTable" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "Customer" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "MenuCategory" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "MenuItem" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "MenuItemVariation" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "AddOn" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "Order" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "OrderItem" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "Payment" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "KitchenOrder" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "KitchenOrderItem" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "Reservation" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "InventoryItem" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "InventoryTransaction" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "Recipe" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "RecipeIngredient" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "Supplier" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "Purchase" ALTER COLUMN "restaurantId" SET NOT NULL;
ALTER TABLE "PurchaseItem" ALTER COLUMN "restaurantId" SET NOT NULL;

ALTER TABLE "Restaurant" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "Restaurant" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Restaurant" ALTER COLUMN "plan" SET NOT NULL;

-- ---------------------------------------------------------------------------
-- 3) Users: role / permission customisation
-- ---------------------------------------------------------------------------

ALTER TABLE "User"
  ADD COLUMN "roleId" TEXT,
  ADD COLUMN "extraPermissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[],
  ADD COLUMN "restrictedPermissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[],
  ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "invitedById" TEXT;

-- The restaurant owner is the ADMIN account of the tenant.
UPDATE "Restaurant" AS r
   SET "ownerId" = u."id"
  FROM "User" AS u
 WHERE u."restaurantId" = r."id"
   AND u."role" = 'ADMIN'
   AND r."ownerId" IS NULL;

-- ---------------------------------------------------------------------------
-- 4) Custom roles
-- ---------------------------------------------------------------------------

CREATE TABLE "Role" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "permissions" "Permission"[] DEFAULT ARRAY[]::"Permission"[],
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Role_restaurantId_idx" ON "Role"("restaurantId");
CREATE UNIQUE INDEX "Role_restaurantId_slug_key" ON "Role"("restaurantId", "slug");

ALTER TABLE "Role" ADD CONSTRAINT "Role_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 5) Tenant-scoped unique keys
-- ---------------------------------------------------------------------------

DROP INDEX "InventoryItem_sku_key";
DROP INDEX "MenuItem_sku_key";
DROP INDEX "Order_orderNumber_idx";
DROP INDEX "Order_orderNumber_key";
DROP INDEX "Purchase_purchaseNumber_key";
DROP INDEX "RestaurantTable_tableNumber_key";

CREATE UNIQUE INDEX "InventoryItem_restaurantId_sku_key" ON "InventoryItem"("restaurantId", "sku");
CREATE UNIQUE INDEX "MenuItem_restaurantId_sku_key" ON "MenuItem"("restaurantId", "sku");
CREATE UNIQUE INDEX "Order_restaurantId_orderNumber_key" ON "Order"("restaurantId", "orderNumber");
CREATE UNIQUE INDEX "Purchase_restaurantId_purchaseNumber_key" ON "Purchase"("restaurantId", "purchaseNumber");
CREATE UNIQUE INDEX "RestaurantTable_restaurantId_tableNumber_key" ON "RestaurantTable"("restaurantId", "tableNumber");

-- ---------------------------------------------------------------------------
-- 6) Indexes on the new tenant key
-- ---------------------------------------------------------------------------

CREATE INDEX "AddOn_restaurantId_idx" ON "AddOn"("restaurantId");
CREATE INDEX "AuditLog_restaurantId_idx" ON "AuditLog"("restaurantId");
CREATE INDEX "Customer_restaurantId_idx" ON "Customer"("restaurantId");
CREATE INDEX "InventoryItem_restaurantId_idx" ON "InventoryItem"("restaurantId");
CREATE INDEX "InventoryTransaction_restaurantId_idx" ON "InventoryTransaction"("restaurantId");
CREATE INDEX "KitchenOrder_restaurantId_idx" ON "KitchenOrder"("restaurantId");
CREATE INDEX "KitchenOrderItem_restaurantId_idx" ON "KitchenOrderItem"("restaurantId");
CREATE INDEX "MenuCategory_restaurantId_idx" ON "MenuCategory"("restaurantId");
CREATE INDEX "MenuItem_restaurantId_idx" ON "MenuItem"("restaurantId");
CREATE INDEX "MenuItemVariation_restaurantId_idx" ON "MenuItemVariation"("restaurantId");
CREATE INDEX "Order_restaurantId_idx" ON "Order"("restaurantId");
CREATE INDEX "OrderItem_restaurantId_idx" ON "OrderItem"("restaurantId");
CREATE INDEX "Payment_restaurantId_idx" ON "Payment"("restaurantId");
CREATE INDEX "Purchase_restaurantId_idx" ON "Purchase"("restaurantId");
CREATE INDEX "PurchaseItem_restaurantId_idx" ON "PurchaseItem"("restaurantId");
CREATE INDEX "Recipe_restaurantId_idx" ON "Recipe"("restaurantId");
CREATE INDEX "RecipeIngredient_restaurantId_idx" ON "RecipeIngredient"("restaurantId");
CREATE INDEX "Reservation_restaurantId_idx" ON "Reservation"("restaurantId");
CREATE INDEX "RestaurantTable_restaurantId_idx" ON "RestaurantTable"("restaurantId");
CREATE INDEX "Supplier_restaurantId_idx" ON "Supplier"("restaurantId");
CREATE INDEX "TableSection_restaurantId_idx" ON "TableSection"("restaurantId");
CREATE INDEX "User_restaurantId_idx" ON "User"("restaurantId");
CREATE INDEX "User_roleId_idx" ON "User"("roleId");
CREATE INDEX "User_status_idx" ON "User"("status");
CREATE INDEX "Restaurant_status_idx" ON "Restaurant"("status");
CREATE INDEX "Restaurant_plan_idx" ON "Restaurant"("plan");
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");

-- ---------------------------------------------------------------------------
-- 7) Foreign keys
-- ---------------------------------------------------------------------------

ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_ownerId_fkey"
  FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey"
  FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "User" ADD CONSTRAINT "User_invitedById_fkey"
  FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TableSection" ADD CONSTRAINT "TableSection_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RestaurantTable" ADD CONSTRAINT "RestaurantTable_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuCategory" ADD CONSTRAINT "MenuCategory_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuItem" ADD CONSTRAINT "MenuItem_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MenuItemVariation" ADD CONSTRAINT "MenuItemVariation_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AddOn" ADD CONSTRAINT "AddOn_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Order" ADD CONSTRAINT "Order_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KitchenOrder" ADD CONSTRAINT "KitchenOrder_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KitchenOrderItem" ADD CONSTRAINT "KitchenOrderItem_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RecipeIngredient" ADD CONSTRAINT "RecipeIngredient_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PurchaseItem" ADD CONSTRAINT "PurchaseItem_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_restaurantId_fkey"
  FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ---------------------------------------------------------------------------
-- 8) Role <-> tenant invariant
--
-- Only the platform super admin may exist without a restaurant; every other
-- account must belong to exactly one restaurant. The comparison is done on the
-- text representation so this statement does not depend on the enum value
-- added earlier in the same migration being committed.
-- ---------------------------------------------------------------------------

ALTER TABLE "User" ADD CONSTRAINT "User_role_tenant_check"
  CHECK (
    ("role"::text = 'SUPER_ADMIN' AND "restaurantId" IS NULL)
    OR ("role"::text <> 'SUPER_ADMIN' AND "restaurantId" IS NOT NULL)
  );
