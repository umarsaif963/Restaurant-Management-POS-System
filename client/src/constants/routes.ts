import {
  Activity,
  BookOpenText,
  Boxes,
  CalendarDays,
  ChefHat,
  ClipboardList,
  LayoutGrid,
  MonitorPlay,
  ReceiptText,
  Settings,
  ShoppingCart,
  Truck,
  UserRound,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react';
import type { UserRole } from '@restaurant/shared';

export const APP_NAME = 'Restaurant POS';
export const APP_VERSION = '1.0.0';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Limit the item to these roles. Omit to show to every signed-in user. */
  roles?: UserRole[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
  /** Limit the whole section to these roles. Omit to show to everyone. */
  roles?: UserRole[];
}

/**
 * Single source of truth for sidebar navigation.
 * Each module adds its own sections here as it is implemented.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'General',
    items: [
      {
        label: 'System Status',
        to: '/',
        icon: Activity,
        end: true,
      },
      {
        label: 'My Profile',
        to: '/profile',
        icon: UserRound,
      },
    ],
  },
  {
    title: 'Operations',
    items: [
      {
        label: 'Point of Sale',
        to: '/pos',
        icon: ShoppingCart,
        roles: ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'],
      },
      {
        label: 'Orders',
        to: '/orders',
        icon: ReceiptText,
      },
      {
        label: 'Kitchen',
        to: '/kitchen',
        icon: ChefHat,
        roles: ['ADMIN', 'MANAGER', 'KITCHEN_STAFF'],
      },
      {
        label: 'Kitchen Display',
        to: '/kds',
        icon: MonitorPlay,
        roles: ['ADMIN', 'MANAGER', 'KITCHEN_STAFF'],
      },
      {
        label: 'Menu',
        to: '/menu',
        icon: UtensilsCrossed,
      },
      {
        label: 'Inventory',
        to: '/inventory',
        icon: Boxes,
      },
      {
        label: 'Recipes',
        to: '/recipes',
        icon: BookOpenText,
      },
      {
        label: 'Suppliers',
        to: '/suppliers',
        icon: Truck,
      },
      {
        label: 'Purchases',
        to: '/purchases',
        icon: ClipboardList,
      },
      {
        label: 'Reservations',
        to: '/reservations',
        icon: CalendarDays,
      },
      {
        label: 'Tables',
        to: '/tables',
        icon: LayoutGrid,
      },
      {
        label: 'Customers',
        to: '/customers',
        icon: Users,
        roles: ['ADMIN', 'MANAGER', 'CASHIER', 'WAITER'],
      },
    ],
  },
  {
    title: 'Administration',
    roles: ['ADMIN', 'MANAGER'],
    items: [
      {
        label: 'Users',
        to: '/users',
        icon: Users,
        roles: ['ADMIN', 'MANAGER'],
      },
      {
        label: 'Settings',
        to: '/settings',
        icon: Settings,
        roles: ['ADMIN', 'MANAGER'],
      },
    ],
  },
];