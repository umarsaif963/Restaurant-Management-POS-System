import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthUser } from '@restaurant/shared';
import { authApi } from '../api/authApi';

export type AuthStatus = 'idle' | 'authenticated' | 'unauthenticated';

export interface AuthState {
  user: AuthUser | null;
  status: AuthStatus;
}

const initialState: AuthState = {
  user: null,
  status: 'idle',
};

/**
 * Mirror of the current session kept in sync with the RTK Query `getMe` /
 * `login` / `logout` outcomes. The authoritative fetch lives in `authApi`;
 * this slice just gives components (sidebar, topbar) a synchronous read of the
 * signed-in user without re-triggering requests.
 */
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearSession(state) {
      state.user = null;
      state.status = 'unauthenticated';
    },
    setUser(state, action: PayloadAction<AuthUser>) {
      state.user = action.payload;
      state.status = 'authenticated';
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        authApi.endpoints.getMe.matchFulfilled,
        (state, action: PayloadAction<AuthUser>) => {
          state.user = action.payload;
          state.status = 'authenticated';
        },
      )
      .addMatcher(authApi.endpoints.getMe.matchRejected, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
      })
      .addMatcher(
        authApi.endpoints.login.matchFulfilled,
        (state, action: PayloadAction<AuthUser>) => {
          state.user = action.payload;
          state.status = 'authenticated';
        },
      )
      .addMatcher(authApi.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
        state.status = 'unauthenticated';
      });
  },
});

export const { clearSession, setUser } = authSlice.actions;
export default authSlice.reducer;