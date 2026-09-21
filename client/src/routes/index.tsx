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