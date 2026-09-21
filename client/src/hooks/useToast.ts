import { useCallback } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { addToast, type ToastType } from '@/store/slices/toastSlice';

/**
 * Real toast actions wired to the central toast store.
 */
export function useToast() {
  const dispatch = useAppDispatch();

  const show = useCallback(
    (type: ToastType, title: string, message?: string) => {
      dispatch(addToast({ type, title, message }));
    },
    [dispatch],
  );

  const success = useCallback(
    (title: string, message?: string) => show('success', title, message),
    [show],
  );

  const error = useCallback(
    (title: string, message?: string) => show('error', title, message),
    [show],
  );

  const info = useCallback(
    (title: string, message?: string) => show('info', title, message),
    [show],
  );

  return { show, success, error, info };
}