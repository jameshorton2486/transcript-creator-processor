
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Check if we're in demo mode (no API keys)
const isDemoMode = 
  !import.meta.env.VITE_FIREBASE_API_KEY || 
  import.meta.env.VITE_FIREBASE_API_KEY === 'demo-mode';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase if we have valid config
let app;
let auth;
let googleProvider;

if (!isDemoMode && firebaseConfig.apiKey) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  console.log("Firebase in demo mode - authentication features will be unavailable");
  
  // Create dummy implementations for demo mode with clearer implementation
  app = null;
  auth = {
    currentUser: null,
    onAuthStateChanged: (callback) => {
      // Call callback with null to indicate no user
      callback(null);
      // Return no-op unsubscribe function
      return () => {};
    },
    // Add other necessary dummy methods
    signInWithPopup: () => Promise.reject(new Error("Authentication unavailable in demo mode")),
    signOut: () => Promise.resolve()
  } as any;
  googleProvider = {} as any;
}

// Export with better JSDoc documentation
/**
 * Firebase app instance (null in demo mode)
 */
export const firebaseApp = app;

/**
 * Firebase auth instance (mocked in demo mode)
 */
export const auth = auth;

/**
 * Google auth provider for sign-in (mocked in demo mode)
 */
export const googleProvider = googleProvider;

/**
 * Flag indicating if the app is running in demo mode without real Firebase credentials
 */
export const isDemoMode = isDemoMode;
