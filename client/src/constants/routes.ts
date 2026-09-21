import { Activity, UserRound, Users, type LucideIcon } from 'lucide-react';
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
    title: 'Administration',
    roles: ['ADMIN', 'MANAGER'],
    items: [
      {
        label: 'Users',
        to: '/users',
        icon: Users,
        roles: ['ADMIN', 'MANAGER'],
      },
    ],
  },
];