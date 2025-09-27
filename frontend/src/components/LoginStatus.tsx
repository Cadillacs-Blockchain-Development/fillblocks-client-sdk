import React from 'react';
import { useAppSelector } from '../store/hooks';

const LoginStatus: React.FC = () => {
  const { apiUser, token, loginLoading, loginError } = useAppSelector((state) => state.auth);

  if (loginLoading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-600">Logging in...</p>
      </div>
    );
  }

  if (loginError) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">Login Error: {loginError}</p>
      </div>
    );
  }

  if (apiUser && token) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="space-y-2">
          <p className="text-green-600 font-semibold">
            Welcome, {apiUser.name}! You are successfully logged in via Redux.
          </p>
          <div className="text-sm text-green-600 space-y-1">
            <p><strong>Email:</strong> {apiUser.email}</p>
            <p><strong>User ID:</strong> {apiUser._id}</p>
            <p><strong>Status:</strong> {apiUser.status}</p>
            <p><strong>Email Verified:</strong> {apiUser.isEmailVerified ? 'Yes' : 'No'}</p>
            <p><strong>Token:</strong> {token.substring(0, 20)}...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <p className="text-gray-600">Not logged in</p>
    </div>
  );
};

export default LoginStatus;
