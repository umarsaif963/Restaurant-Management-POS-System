import { Activity, type LucideIcon } from 'lucide-react';

export const APP_NAME = 'Restaurant POS';
export const APP_VERSION = '1.0.0';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
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
    ],
  },
];