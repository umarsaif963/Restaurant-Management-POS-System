/**
 * Browser-local storage for the restaurant icon chosen in Settings.
 *
 * The settings API only accepts a short `logoUrl` (max 500 chars, validated as
 * a URL) and offers no file-upload endpoint, so the uploaded image is kept in
 * this browser's localStorage, scoped per restaurant. Every write publishes a
 * change event so the sidebar (and the Settings preview) re-render immediately
 * without a reload.
 */

const KEY_PREFIX = 'restaurant.icon.';

type Listener = () => void;

const listeners = new Set<Listener>();

function storageKey(restaurantId: string): string {
  return `${KEY_PREFIX}${restaurantId}`;
}

function emit(): void {
  for (const listener of listeners) listener();
}

/** Current icon data URL for a restaurant, or null when none is uploaded. */
export function readRestaurantIcon(restaurantId: string | null | undefined): string | null {
  if (!restaurantId) return null;
  try {
    return window.localStorage.getItem(storageKey(restaurantId));
  } catch {
    // Storage may be disabled (private mode); fall back to the default logo.
    return null;
  }
}

/**
 * Persist an uploaded icon. Throws when localStorage is unavailable or full so
 * the caller can surface a real error instead of silently losing the upload.
 */
export function writeRestaurantIcon(restaurantId: string, dataUrl: string): void {
  window.localStorage.setItem(storageKey(restaurantId), dataUrl);
  emit();
}

/** Drop the uploaded icon so the default logo shows again. */
export function removeRestaurantIcon(restaurantId: string): void {
  window.localStorage.removeItem(storageKey(restaurantId));
  emit();
}

/** Subscribe to icon changes (same-tab writes and cross-tab storage events). */
export function subscribeRestaurantIcons(listener: Listener): () => void {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key.startsWith(KEY_PREFIX)) listener();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}
