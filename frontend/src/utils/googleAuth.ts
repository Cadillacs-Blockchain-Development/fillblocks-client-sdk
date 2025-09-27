import axios from 'axios';
import type { User } from 'firebase/auth';

export interface GoogleUserData {
  email: string;
  name: string;
  profileUrl: string;
}

export const extractUserDataFromFirebase = (
  firebaseUser: User
): GoogleUserData => {
  return {
    email: firebaseUser.email || '',
    name: firebaseUser.displayName || '',
    profileUrl: firebaseUser.photoURL || '',
  };
};

export const callGoogleSignupAPI = async (userData: GoogleUserData) => {
  const baseUrl = import.meta.env.VITE_BASE_URL as string;

  const response = await axios.post(
    `${baseUrl}/auth/login-with-google`,
    userData,
    {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    }
  );

  return response.data;
};
