import { useEffect, useState } from 'react';

/**
 * Returns a value that lags its input until the value settles for `delay` ms.
 * Used to avoid firing queries on every keystroke.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(id);
  }, [value, delay]);

  return debounced;
}