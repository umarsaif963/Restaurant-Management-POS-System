import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { SystemStatusPage } from '@/pages/SystemStatusPage';
import { UsersPage } from '@/pages/UsersPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TablesPage } from '@/pages/TablesPage';
import { CustomersPage } from '@/pages/CustomersPage';
import { MenuPage } from '@/pages/MenuPage';
import { InventoryPage } from '@/pages/InventoryPage';
import { RecipesPage } from '@/pages/RecipesPage';
import { SuppliersPage } from '@/pages/SuppliersPage';
import { PurchasesPage } from '@/pages/PurchasesPage';
import { ReservationsPage } from '@/pages/ReservationsPage';
import { POSPage } from '@/pages/POSPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { KitchenOrdersPage } from '@/pages/kitchen/KitchenOrdersPage';
import { KdsPage } from '@/pages/kds/KdsPage';
import { PrintReceiptPage } from '@/pages/print/PrintReceiptPage';
import { PrintKitchenPage } from '@/pages/print/PrintKitchenPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/print/receipt/:orderId',
    element: (
      <RequireAuth>
        <PrintReceiptPage />
      </RequireAuth>
    ),
  },
  {
    path: '/print/kitchen/:kitchenOrderId',
    element: (
      <RequireAuth>
        <PrintKitchenPage />
      </RequireAuth>
    ),
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <SystemStatusPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'tables',
        element: <TablesPage />,
      },
      {
        path: 'pos',
        element: (
          <RoleGuard roles={['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']}>
            <POSPage />
          </RoleGuard>
        ),
      },
      {
        path: 'orders',
        element: <OrdersPage />,
      },
      {
        path: 'kitchen',
        element: (
          <RoleGuard roles={['ADMIN', 'MANAGER', 'KITCHEN_STAFF']}>
            <KitchenOrdersPage />
          </RoleGuard>
        ),
      },
      {
        path: 'kds',
        element: (
          <RoleGuard roles={['ADMIN', 'MANAGER', 'KITCHEN_STAFF']}>
            <KdsPage />
          </RoleGuard>
        ),
      },
      {
        path: 'menu',
        element: <MenuPage />,
      },
      {
        path: 'inventory',
        element: <InventoryPage />,
      },
      {
        path: 'recipes',
        element: <RecipesPage />,
      },
      {
        path: 'suppliers',
        element: <SuppliersPage />,
      },
      {
        path: 'purchases',
        element: <PurchasesPage />,
      },
      {
        path: 'reservations',
        element: <ReservationsPage />,
      },
      {
        path: 'customers',
        element: (
          <RoleGuard roles={['ADMIN', 'MANAGER', 'CASHIER', 'WAITER']}>
            <CustomersPage />
          </RoleGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleGuard roles={['ADMIN', 'MANAGER']}>
            <UsersPage />
          </RoleGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <RoleGuard roles={['ADMIN', 'MANAGER']}>
            <SettingsPage />
          </RoleGuard>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);