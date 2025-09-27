# Firebase Setup for SignUp Page

## Overview

The SignUp page has been configured with Firebase Authentication to support:

- Email/password registration
- Google OAuth login
- Apple OAuth login
- Slack OAuth login (UI ready, needs provider setup)

## Configuration Required

### 1. Firebase Project Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication in the Firebase console
4. Add your domain to authorized domains

### 2. Update Firebase Config

Edit `src/firebase/config.ts` and replace the placeholder values with your actual Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: 'your-actual-api-key',
  authDomain: 'your-project.firebaseapp.com',
  projectId: 'your-actual-project-id',
  storageBucket: 'your-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'your-actual-app-id',
};
```

### 3. Enable Authentication Providers

In Firebase Console > Authentication > Sign-in method:

#### Email/Password

- Enable "Email/Password" provider

#### Google OAuth

- Enable "Google" provider
- Add your domain to authorized domains
- Configure OAuth consent screen if needed

#### Apple OAuth

- Enable "Apple" provider
- Configure Apple Developer account settings
- Add your domain to authorized domains

#### Slack OAuth (Optional)

- Enable "Custom" provider or use Slack's OAuth
- Configure Slack app settings
- Add redirect URIs

## Features Implemented

### Email/Password Registration

- Form validation
- Error handling
- Loading states
- Password field with lock icon

### Social Login

- Google OAuth with popup
- Apple OAuth with popup
- Slack button (ready for implementation)
- Loading states and error handling

### UI Enhancements

- Error message display
- Loading indicators
- Disabled states during authentication
- Responsive design maintained

## Usage

The SignUp component is ready to use. Users can:

1. Enter email and password to create an account
2. Click social login buttons for OAuth authentication
3. See loading states and error messages
4. Experience smooth transitions and feedback

## Next Steps

1. Configure your Firebase project with the actual credentials
2. Enable the desired authentication providers
3. Test the authentication flow
4. Add redirect logic after successful authentication
5. Implement user profile management if needed
