import type { ApiUser } from '../store/authSlice';

const STORAGE_KEYS = {
  USER: 'fillblocks_user',
  TOKEN: 'fillblocks_token',
} as const;

export const saveAuthToStorage = (user: ApiUser, token: string) => {
  try {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    console.log('Auth data saved to localStorage');
  } catch (error) {
    console.error('Failed to save auth data to localStorage:', error);
  }
};

export const getAuthFromStorage = (): {
  user: ApiUser | null;
  token: string | null;
} => {
  try {
    const userStr = localStorage.getItem(STORAGE_KEYS.USER);
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);

    const user = userStr ? JSON.parse(userStr) : null;

    return { user, token };
  } catch (error) {
    console.error('Failed to get auth data from localStorage:', error);
    return { user: null, token: null };
  }
};

export const clearAuthFromStorage = () => {
  try {
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    console.log('Auth data cleared from localStorage');
  } catch (error) {
    console.error('Failed to clear auth data from localStorage:', error);
  }
};

export const isTokenValid = (token: string): boolean => {
  if (!token) return false;

  try {
    // Decode JWT token to check expiration
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;

    // Check if token is expired
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Failed to validate token:', error);
    return false;
  }
};
