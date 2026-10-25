import {
  Activity,
  BarChart3,
  BookOpenText,
  Boxes,
  CalendarDays,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  MonitorPlay,
  ReceiptText,
  Settings,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Truck,
  UserRound,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import type { Permission } from '@restaurant/shared';

export const APP_NAME = 'Restaurant POS';
export const APP_VERSION = '2.0.0';
export const PLATFORM_NAME = 'Restaurant Platform Console';

/** Everything of the point-of-sale workspace lives under this prefix. */
export const APP_BASE_PATH = '/app';
/** The platform console lives under its own prefix. */
export const PLATFORM_BASE_PATH = '/platform';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Permissions required to see the entry. Empty/omitted means every signed-in
   *  account may see it. */
  permissions?: Permission[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
  /** Permissions required to see the whole section. */
  permissions?: Permission[];
}

/**
 * Single source of truth for sidebar navigation.
 *
 * Visibility is driven by the permissions the server resolved for the signed-in
 * account, not by the job role: a custom role with the same capabilities shows
 * exactly the same entries as the built-in role would.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'General',
    items: [
      {
        label: 'System Status',
        to: APP_BASE_PATH,
        icon: Activity,
        end: true,
      },
      {
        label: 'My Profile',
        to: `${APP_BASE_PATH}/profile`,
        icon: UserRound,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Point of Sale',
        to: `${APP_BASE_PATH}/pos`,
        icon: ShoppingCart,
        permissions: ['POS_USE'],
      },
      {
        label: 'Orders',
        to: `${APP_BASE_PATH}/orders`,
        icon: ReceiptText,
        permissions: ['ORDERS_READ'],
      },
      {
        label: 'Kitchen',
        to: `${APP_BASE_PATH}/kitchen`,
        icon: ChefHat,
        permissions: ['KITCHEN_READ'],
      },
      {
        label: 'Kitchen Display',
        to: `${APP_BASE_PATH}/kds`,
        icon: MonitorPlay,
        permissions: ['KDS_VIEW'],
      },
      {
        label: 'Menu',
        to: `${APP_BASE_PATH}/menu`,
        icon: UtensilsCrossed,
        permissions: ['MENU_READ'],
      },
      {
        label: 'Inventory',
        to: `${APP_BASE_PATH}/inventory`,
        icon: Boxes,
        permissions: ['INVENTORY_READ'],
      },
      {
        label: 'Recipes',
        to: `${APP_BASE_PATH}/recipes`,
        icon: BookOpenText,
        permissions: ['RECIPES_READ'],
      },
      {
        label: 'Suppliers',
        to: `${APP_BASE_PATH}/suppliers`,
        icon: Truck,
        permissions: ['SUPPLIERS_READ'],
      },
      {
        label: 'Purchases',
        to: `${APP_BASE_PATH}/purchases`,
        icon: ClipboardList,
        permissions: ['PURCHASES_READ'],
      },
      {
        label: 'Reservations',
        to: `${APP_BASE_PATH}/reservations`,
        icon: CalendarDays,
        permissions: ['RESERVATIONS_READ'],
      },
      {
        label: 'Tables',
        to: `${APP_BASE_PATH}/tables`,
        icon: LayoutGrid,
        permissions: ['TABLES_READ'],
      },
      {
        label: 'Customers',
        to: `${APP_BASE_PATH}/customers`,
        icon: Users,
        permissions: ['CUSTOMERS_READ'],
      },
    ],
  },
  {
    title: 'Insights',
    items: [
      {
        label: 'Dashboard',
        to: `${APP_BASE_PATH}/dashboard`,
        icon: LayoutDashboard,
        permissions: ['DASHBOARD_VIEW'],
      },
      {
        label: 'Reports',
        to: `${APP_BASE_PATH}/reports`,
        icon: BarChart3,
        permissions: ['REPORTS_VIEW'],
      },
    ],
  },
  {
    title: 'Administration',
    items: [
      {
        label: 'Employees',
        to: `${APP_BASE_PATH}/employees`,
        icon: Users,
        permissions: ['EMPLOYEES_READ'],
      },
      {
        label: 'Roles',
        to: `${APP_BASE_PATH}/roles`,
        icon: ShieldCheck,
        permissions: ['ROLES_READ'],
      },
      {
        label: 'Settings',
        to: `${APP_BASE_PATH}/settings`,
        icon: Settings,
        permissions: ['SETTINGS_READ'],
      },
      {
        label: 'Audit Logs',
        to: `${APP_BASE_PATH}/audit-logs`,
        icon: ScrollText,
        permissions: ['AUDIT_LOGS_VIEW'],
      },
    ],
  },
];
