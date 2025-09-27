import { useAppSelector, useAppDispatch } from '../store/hooks';
import { logout, setToken } from '../store/authSlice';

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const { apiUser, token, loginLoading, loginError } = useAppSelector(
    (state) => state.auth
  );

  const isAuthenticated = !!apiUser && !!token;

  const handleLogout = () => {
    dispatch(logout());
  };

  const updateToken = (newToken: string) => {
    dispatch(setToken(newToken));
  };

  return {
    user: apiUser,
    token,
    isAuthenticated,
    isLoading: loginLoading,
    error: loginError,
    logout: handleLogout,
    updateToken,
  };
};
