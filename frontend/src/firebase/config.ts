import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyCUn4QQjXmzZ2RP53C5qeDlVdrNRPLAS4g',
  authDomain: 'fillblocks-2e396.firebaseapp.com',
  projectId: 'fillblocks-2e396',
  storageBucket: 'fillblocks-2e396.firebasestorage.app',
  messagingSenderId: '332325132274',
  appId: '1:332325132274:web:245aed793b41440481bd6b',
  measurementId: 'G-LF2BWND877',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firebase Analytics
export const analytics = getAnalytics(app);

// Debug: Log Firebase initialization
console.log('Firebase initialized:', app.name);
console.log('Auth instance:', auth);

export default app;
