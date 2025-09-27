import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { User } from 'firebase/auth';
import {
  saveAuthToStorage,
  clearAuthFromStorage,
  getAuthFromStorage,
  isTokenValid,
} from '../utils/storage';

// Custom user interface for API responses
export interface ApiUser {
  _id: string;
  email: string;
  name: string;
  profileUrl: string;
  password: string;
  isEmailVerified: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface AuthState {
  user: User | null;
  apiUser: ApiUser | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  loginLoading: boolean;
  loginError: string | null;
}

// Get initial state from localStorage
const { user: storedUser, token: storedToken } = getAuthFromStorage();
const isStoredTokenValid = storedToken ? isTokenValid(storedToken) : false;

const initialState: AuthState = {
  user: null,
  apiUser: isStoredTokenValid ? storedUser : null,
  token: isStoredTokenValid ? storedToken : null,
  loading: false, // Will be set to true temporarily during initialization
  error: null,
  loginLoading: false,
  loginError: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearError: (state) => {
      state.error = null;
    },
    logout: (state) => {
      state.user = null;
      state.apiUser = null;
      state.token = null;
      state.loading = false;
      state.error = null;
      clearAuthFromStorage();
    },
    // Login-specific actions
    setLoginLoading: (state, action: PayloadAction<boolean>) => {
      state.loginLoading = action.payload;
      if (action.payload) {
        state.loginError = null;
      }
    },
    setLoginError: (state, action: PayloadAction<string | null>) => {
      state.loginError = action.payload;
      state.loginLoading = false;
    },
    clearLoginError: (state) => {
      state.loginError = null;
    },
    loginSuccess: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.loginLoading = false;
      state.loginError = null;
    },
    // API login success with custom user data
    apiLoginSuccess: (
      state,
      action: PayloadAction<{ user: ApiUser; token: string }>
    ) => {
      state.apiUser = action.payload.user;
      state.token = action.payload.token;
      state.loginLoading = false;
      state.loginError = null;
      saveAuthToStorage(action.payload.user, action.payload.token);
    },
    setApiUser: (state, action: PayloadAction<ApiUser | null>) => {
      state.apiUser = action.payload;
    },
    setToken: (state, action: PayloadAction<string | null>) => {
      state.token = action.payload;
    },
    initializeAuth: (state) => {
      state.loading = true;
      const { user: storedUser, token: storedToken } = getAuthFromStorage();
      const isStoredTokenValid = storedToken
        ? isTokenValid(storedToken)
        : false;

      if (isStoredTokenValid && storedUser) {
        state.apiUser = storedUser;
        state.token = storedToken;
        console.log('Auth initialized from localStorage');
      } else {
        // Clear invalid data
        state.apiUser = null;
        state.token = null;
        clearAuthFromStorage();
        console.log('No valid auth data found in localStorage');
      }
      state.loading = false;
    },
  },
});

export const {
  setUser,
  setLoading,
  setError,
  clearError,
  logout,
  setLoginLoading,
  setLoginError,
  clearLoginError,
  loginSuccess,
  apiLoginSuccess,
  setApiUser,
  setToken,
  initializeAuth,
} = authSlice.actions;
export default authSlice.reducer;
