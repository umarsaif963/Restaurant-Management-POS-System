import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { PlatformGuard } from '@/components/auth/PlatformGuard';
import { MarketingLayout } from '@/components/marketing/MarketingLayout';
import { SystemStatusPage } from '@/pages/SystemStatusPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { RolesPage } from '@/pages/RolesPage';
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
import { DashboardPage } from '@/pages/DashboardPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { AuditLogsPage } from '@/pages/AuditLogsPage';
import { POSPage } from '@/pages/POSPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { KitchenOrdersPage } from '@/pages/kitchen/KitchenOrdersPage';
import { KdsPage } from '@/pages/kds/KdsPage';
import { PrintReceiptPage } from '@/pages/print/PrintReceiptPage';
import { PrintKitchenPage } from '@/pages/print/PrintKitchenPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';
import { HomePage } from '@/pages/marketing/HomePage';
import { FeaturesPage } from '@/pages/marketing/FeaturesPage';
import { PricingPage } from '@/pages/marketing/PricingPage';
import { AboutPage } from '@/pages/marketing/AboutPage';
import { ContactPage } from '@/pages/marketing/ContactPage';
import { PrivacyPage } from '@/pages/marketing/PrivacyPage';
import { TermsPage } from '@/pages/marketing/TermsPage';
import { PlatformLayout } from '@/pages/platform/PlatformLayout';
import { PlatformRestaurantsPage } from '@/pages/platform/PlatformRestaurantsPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  // ---- Public marketing site -------------------------------------
  {
    path: '/',
    element: (
      <MarketingLayout>
        <HomePage />
      </MarketingLayout>
    ),
  },
  {
    path: '/features',
    element: (
      <MarketingLayout>
        <FeaturesPage />
      </MarketingLayout>
    ),
  },
  {
    path: '/pricing',
    element: (
      <MarketingLayout>
        <PricingPage />
      </MarketingLayout>
    ),
  },
  {
    path: '/about',
    element: (
      <MarketingLayout>
        <AboutPage />
      </MarketingLayout>
    ),
  },
  {
    path: '/contact',
    element: (
      <MarketingLayout>
        <ContactPage />
      </MarketingLayout>
    ),
  },
  {
    path: '/privacy',
    element: (
      <MarketingLayout>
        <PrivacyPage />
      </MarketingLayout>
    ),
  },
  {
    path: '/terms',
    element: (
      <MarketingLayout>
        <TermsPage />
      </MarketingLayout>
    ),
  },

  // ---- Authentication ---------------------------------------------
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },

  // ---- Printable documents (standalone, no workspace shell) --------
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

  // ---- Restaurant workspace ---------------------------------------
  {
    path: '/app',
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
        element: (
          <PermissionGuard permissions={['TABLES_READ']}>
            <TablesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'pos',
        element: (
          <PermissionGuard permissions={['POS_USE']}>
            <POSPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'orders',
        element: (
          <PermissionGuard permissions={['ORDERS_READ']}>
            <OrdersPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'kitchen',
        element: (
          <PermissionGuard permissions={['KITCHEN_READ']}>
            <KitchenOrdersPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'kds',
        element: (
          <PermissionGuard permissions={['KDS_VIEW']}>
            <KdsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'menu',
        element: (
          <PermissionGuard permissions={['MENU_READ']}>
            <MenuPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'inventory',
        element: (
          <PermissionGuard permissions={['INVENTORY_READ']}>
            <InventoryPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'recipes',
        element: (
          <PermissionGuard permissions={['RECIPES_READ']}>
            <RecipesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'suppliers',
        element: (
          <PermissionGuard permissions={['SUPPLIERS_READ']}>
            <SuppliersPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'purchases',
        element: (
          <PermissionGuard permissions={['PURCHASES_READ']}>
            <PurchasesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'reservations',
        element: (
          <PermissionGuard permissions={['RESERVATIONS_READ']}>
            <ReservationsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <PermissionGuard permissions={['DASHBOARD_VIEW']}>
            <DashboardPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'reports',
        element: (
          <PermissionGuard permissions={['REPORTS_VIEW']}>
            <ReportsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'audit-logs',
        element: (
          <PermissionGuard permissions={['AUDIT_LOGS_VIEW']}>
            <AuditLogsPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'customers',
        element: (
          <PermissionGuard permissions={['CUSTOMERS_READ']}>
            <CustomersPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'employees',
        element: (
          <PermissionGuard permissions={['EMPLOYEES_READ']}>
            <EmployeesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'roles',
        element: (
          <PermissionGuard permissions={['ROLES_READ']}>
            <RolesPage />
          </PermissionGuard>
        ),
      },
      {
        path: 'settings',
        element: (
          <PermissionGuard permissions={['SETTINGS_READ']}>
            <SettingsPage />
          </PermissionGuard>
        ),
      },
    ],
  },

  // ---- Platform console -------------------------------------------
  {
    path: '/platform',
    element: (
      <RequireAuth>
        <PlatformGuard>
          <PlatformLayout>
            <PlatformRestaurantsPage />
          </PlatformLayout>
        </PlatformGuard>
      </RequireAuth>
    ),
  },

  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
