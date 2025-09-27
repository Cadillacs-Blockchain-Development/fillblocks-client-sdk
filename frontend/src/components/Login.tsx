import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import {
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../firebase/config';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLoginLoading, setLoginError, clearLoginError, apiLoginSuccess } from '../store/authSlice';
import { extractUserDataFromFirebase, callGoogleSignupAPI } from '../utils/googleAuth';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  // Redux state and dispatch
  const dispatch = useAppDispatch();
  const { loginLoading, loginError } = useAppSelector((state) => state.auth);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(setLoginLoading(true));
    dispatch(clearLoginError());

    try {
      const baseUrl = import.meta.env.VITE_BASE_URL as string;
      const { data } = await axios.post(`${baseUrl}/auth/login`, {
        email: email.trim(),
        password
      }, {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true // Important for cookies
      });

      console.log('Full API response:', data);

      // Check if we have the expected response structure
      if (!data || !data.user || !data.token) {
        throw new Error(data?.message || 'Invalid response from server');
      }

      console.log('User logged in:', data.user);
      console.log('Token received:', data.token);

      // Store API user data and token in Redux
      dispatch(apiLoginSuccess({
        user: data.user,
        token: data.token
      }));

      toast.success(data.message || 'Welcome back! 🎉');
      navigate('/');
    } catch (error: unknown) {
      console.error('Login error details:', error);
      let errorMessage = 'An error occurred during login';

      // Axios error handling
      if (typeof error === 'object' && error !== null && 'isAxiosError' in error) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        const apiMsg = err?.response?.data?.message;
        if (apiMsg) {
          errorMessage = apiMsg;
          if (apiMsg.toLowerCase().includes('invalid') || apiMsg.toLowerCase().includes('not found')) {
            toast.error('Invalid email or password. Please try again.');
          } else {
            toast.error(apiMsg);
          }
        } else if (err?.message) {
          errorMessage = err.message;
          toast.error(err.message);
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
        toast.error(error.message);
      }

      dispatch(setLoginError(errorMessage));
    } finally {
      dispatch(setLoginLoading(false));
    }
  };

  const handleGoogleLogin = async () => {
    dispatch(setLoginLoading(true));
    dispatch(clearLoginError());

    try {
      const authProvider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, authProvider);
      console.log('Google login successful:', result.user);

      // Extract user details from Firebase
      const userData = extractUserDataFromFirebase(result.user);
      console.log('User data for API:', userData);

      // Call your API with Google user details
      const data = await callGoogleSignupAPI(userData);

      console.log('Google API response:', data);

      // Validate API response
      if (!data.user || !data.token) {
        throw new Error('Invalid response from server - missing user data or token');
      }

      // Store API user data and token in Redux
      dispatch(apiLoginSuccess({
        user: data.user,
        token: data.token
      }));

      toast.success('Welcome! Signed in with Google 🎉');
      navigate('/');
    } catch (error: unknown) {
      console.error('Google login error:', error);
      let errorMessage = 'An error occurred during Google login';

      // Handle API errors
      if (typeof error === 'object' && error !== null && 'isAxiosError' in error) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        const apiMsg = err?.response?.data?.message;
        if (apiMsg) {
          errorMessage = apiMsg;
        } else if (err?.message) {
          errorMessage = err.message;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      dispatch(setLoginError(errorMessage));
      toast.error(errorMessage);
    } finally {
      dispatch(setLoginLoading(false));
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-5">
      <div className="bg-white rounded-xl p-10 max-w-md w-full shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center leading-tight">
          Welcome back
        </h1>

        <div className="space-y-3 mb-6">
          <button
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-lg bg-white text-gray-900 text-base font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGoogleLogin}
            disabled={loginLoading}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-500">Or</span>
          </div>
        </div>

        {loginError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{loginError}</p>
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="mb-6">
          <div className="relative mb-4">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24">
              <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            <input
              type="email"
              placeholder="Your work email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loginLoading}
            />
          </div>
          <div className="relative mb-4">
            <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" viewBox="0 0 24 24">
              <path fill="currentColor" d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
            </svg>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg text-base bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              disabled={loginLoading}
            />
          </div>
          <button
            type="submit"
            disabled={loginLoading}
            className="w-full py-3 px-4 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loginLoading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <div className="text-center mb-6">
          <a href="#" className="text-sm text-blue-600 hover:text-blue-700 underline">
            Forgot your password?
          </a>
        </div>

        <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
          Don't have an account? <Link to="/signup" className="text-blue-600 underline hover:text-blue-700">Sign up</Link>
        </p>


      </div>
    </div>
  );
};

export default Login;
