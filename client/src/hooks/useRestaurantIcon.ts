import { useSyncExternalStore } from 'react';
import { readRestaurantIcon, subscribeRestaurantIcons } from '@/utils/restaurantIcon';

/**
 * Live view of the restaurant icon uploaded in Settings.
 *
 * Returns a data URL, or null when no icon has been uploaded (callers then
 * show the default logo). Every mounted consumer — sidebar, Settings preview —
 * updates the moment the icon is written or removed.
 */
export function useRestaurantIcon(restaurantId: string | null | undefined): string | null {
  const id = restaurantId ?? null;
  return useSyncExternalStore(
    subscribeRestaurantIcons,
    () => readRestaurantIcon(id),
    () => null,
  );
}
