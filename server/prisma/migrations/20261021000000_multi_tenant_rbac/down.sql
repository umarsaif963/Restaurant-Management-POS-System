-- ---------------------------------------------------------------------------
-- Rollback for 20260101000000_multi_tenant_rbac
--
-- WARNING: this rollback is destructive for anything created after the
-- multi-tenant migration and it collapses every restaurant back into a
-- single tenant. It exists so the change can be reverted deliberately, not
-- as an automatic fallback.
--
-- Run inside a transaction:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f down.sql
-- ---------------------------------------------------------------------------

BEGIN;

-- 1) Remove the platform super admin (it has no tenant).
DELETE FROM "Session" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "role" = 'SUPER_ADMIN');
DELETE FROM "AuditLog" WHERE "userId" IN (SELECT "id" FROM "User" WHERE "role" = 'SUPER_ADMIN');
DELETE FROM "User" WHERE "role" = 'SUPER_ADMIN';

-- 2) Drop the role/tenant invariant.
ALTER TABLE "User" DROP CONSTRAINT "User_role_tenant_check";

-- 3) Drop tenant-scoped foreign keys.
ALTER TABLE "AuditLog" DROP CONSTRAINT "AuditLog_restaurantId_fkey";
ALTER TABLE "PurchaseItem" DROP CONSTRAINT "PurchaseItem_restaurantId_fkey";
ALTER TABLE "Purchase" DROP CONSTRAINT "Purchase_restaurantId_fkey";
ALTER TABLE "Supplier" DROP CONSTRAINT "Supplier_restaurantId_fkey";
ALTER TABLE "RecipeIngredient" DROP CONSTRAINT "RecipeIngredient_restaurantId_fkey";
ALTER TABLE "Recipe" DROP CONSTRAINT "Recipe_restaurantId_fkey";
ALTER TABLE "InventoryTransaction" DROP CONSTRAINT "InventoryTransaction_userId_fkey";
ALTER TABLE "InventoryTransaction" DROP CONSTRAINT "InventoryTransaction_restaurantId_fkey";
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_restaurantId_fkey";
ALTER TABLE "Reservation" DROP CONSTRAINT "Reservation_restaurantId_fkey";
ALTER TABLE "KitchenOrderItem" DROP CONSTRAINT "KitchenOrderItem_restaurantId_fkey";
ALTER TABLE "KitchenOrder" DROP CONSTRAINT "KitchenOrder_restaurantId_fkey";
ALTER TABLE "Payment" DROP CONSTRAINT "Payment_restaurantId_fkey";
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_restaurantId_fkey";
ALTER TABLE "Order" DROP CONSTRAINT "Order_restaurantId_fkey";
ALTER TABLE "AddOn" DROP CONSTRAINT "AddOn_restaurantId_fkey";
ALTER TABLE "MenuItemVariation" DROP CONSTRAINT "MenuItemVariation_restaurantId_fkey";
ALTER TABLE "MenuItem" DROP CONSTRAINT "MenuItem_restaurantId_fkey";
ALTER TABLE "MenuCategory" DROP CONSTRAINT "MenuCategory_restaurantId_fkey";
ALTER TABLE "Customer" DROP CONSTRAINT "Customer_restaurantId_fkey";
ALTER TABLE "RestaurantTable" DROP CONSTRAINT "RestaurantTable_restaurantId_fkey";
ALTER TABLE "TableSection" DROP CONSTRAINT "TableSection_restaurantId_fkey";
ALTER TABLE "User" DROP CONSTRAINT "User_invitedById_fkey";
ALTER TABLE "User" DROP CONSTRAINT "User_roleId_fkey";
ALTER TABLE "User" DROP CONSTRAINT "User_restaurantId_fkey";
ALTER TABLE "Restaurant" DROP CONSTRAINT "Restaurant_ownerId_fkey";

-- 4) Drop the custom role table.
DROP TABLE "Role";

-- 5) Restore the globally unique keys.
DROP INDEX "InventoryItem_restaurantId_sku_key";
DROP INDEX "MenuItem_restaurantId_sku_key";
DROP INDEX "Order_restaurantId_orderNumber_key";
DROP INDEX "Purchase_restaurantId_purchaseNumber_key";
DROP INDEX "RestaurantTable_restaurantId_tableNumber_key";
CREATE UNIQUE INDEX "InventoryItem_sku_key" ON "InventoryItem"("sku");
CREATE UNIQUE INDEX "MenuItem_sku_key" ON "MenuItem"("sku");
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");
CREATE UNIQUE INDEX "Purchase_purchaseNumber_key" ON "Purchase"("purchaseNumber");
CREATE UNIQUE INDEX "RestaurantTable_tableNumber_key" ON "RestaurantTable"("tableNumber");

-- 6) Drop the tenant columns.
ALTER TABLE "User" DROP COLUMN "invitedById";
ALTER TABLE "User" DROP COLUMN "mustChangePassword";
ALTER TABLE "User" DROP COLUMN "restrictedPermissions";
ALTER TABLE "User" DROP COLUMN "extraPermissions";
ALTER TABLE "User" DROP COLUMN "roleId";
ALTER TABLE "User" DROP COLUMN "restaurantId";
ALTER TABLE "AuditLog" DROP COLUMN "restaurantId";
ALTER TABLE "PurchaseItem" DROP COLUMN "restaurantId";
ALTER TABLE "Purchase" DROP COLUMN "restaurantId";
ALTER TABLE "Supplier" DROP COLUMN "restaurantId";
ALTER TABLE "RecipeIngredient" DROP COLUMN "restaurantId";
ALTER TABLE "Recipe" DROP COLUMN "restaurantId";
ALTER TABLE "InventoryTransaction" DROP COLUMN "restaurantId";
ALTER TABLE "InventoryItem" DROP COLUMN "restaurantId";
ALTER TABLE "Reservation" DROP COLUMN "restaurantId";
ALTER TABLE "KitchenOrderItem" DROP COLUMN "restaurantId";
ALTER TABLE "KitchenOrder" DROP COLUMN "restaurantId";
ALTER TABLE "Payment" DROP COLUMN "restaurantId";
ALTER TABLE "OrderItem" DROP COLUMN "restaurantId";
ALTER TABLE "Order" DROP COLUMN "restaurantId";
ALTER TABLE "AddOn" DROP COLUMN "restaurantId";
ALTER TABLE "MenuItemVariation" DROP COLUMN "restaurantId";
ALTER TABLE "MenuItem" DROP COLUMN "restaurantId";
ALTER TABLE "MenuCategory" DROP COLUMN "restaurantId";
ALTER TABLE "Customer" DROP COLUMN "restaurantId";
ALTER TABLE "RestaurantTable" DROP COLUMN "restaurantId";
ALTER TABLE "TableSection" DROP COLUMN "restaurantId";

-- 7) Drop the new Restaurant columns and enums.
ALTER TABLE "Restaurant" DROP COLUMN "ownerId";
ALTER TABLE "Restaurant" DROP COLUMN "plan";
ALTER TABLE "Restaurant" DROP COLUMN "status";
ALTER TABLE "Restaurant" DROP COLUMN "slug";
DROP INDEX "Restaurant_slug_key";
DROP INDEX "Restaurant_status_idx";
DROP INDEX "Restaurant_plan_idx";
DROP TYPE "Permission";
DROP TYPE "SubscriptionPlan";
DROP TYPE "RestaurantStatus";

-- 8) The enum value cannot be removed inside a transaction; run this
--    separately if the rollback must fully restore the old enum:
--      ALTER TYPE "UserRole" RENAME VALUE 'SUPER_ADMIN' TO '__SUPER_ADMIN_RETIRED';

COMMIT;
