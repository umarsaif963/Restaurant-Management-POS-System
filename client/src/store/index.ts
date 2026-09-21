import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from './api/apiSlice';
import uiReducer from './slices/uiSlice';
import toastReducer from './slices/toastSlice';
import authReducer, { clearSession } from './slices/authSlice';
import { onSessionExpired } from '@/services/api';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    ui: uiReducer,
    toasts: toastReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
});

// A failed token refresh means the session is gone; clear the cached user so
// guards redirect to the login screen.
onSessionExpired(() => {
  store.dispatch(clearSession());
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;