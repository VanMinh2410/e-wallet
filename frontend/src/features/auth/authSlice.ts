import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { setAccessToken } from '../../shared/services/api';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  isVerified: boolean;
  kycStatus?: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ user: AuthUser; accessToken: string }>) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      setAccessToken(action.payload.accessToken);
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      setAccessToken(null);
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
