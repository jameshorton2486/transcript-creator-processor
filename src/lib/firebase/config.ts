
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
let firebaseApp;
let firebaseAuth;
let firebaseGoogleProvider;

if (!isDemoMode && firebaseConfig.apiKey) {
  try {
    firebaseApp = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(firebaseApp);
    firebaseGoogleProvider = new GoogleAuthProvider();
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
  }
} else {
  console.log("Firebase in demo mode - authentication features will be unavailable");
  
  // Create dummy implementations for demo mode with clearer implementation
  firebaseApp = null;
  firebaseAuth = {
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
  firebaseGoogleProvider = {} as any;
}

// Export with better JSDoc documentation
/**
 * Firebase app instance (null in demo mode)
 */
export const app = firebaseApp;

/**
 * Firebase auth instance (mocked in demo mode)
 */
export const auth = firebaseAuth;

/**
 * Google auth provider for sign-in (mocked in demo mode)
 */
export const googleProvider = firebaseGoogleProvider;

/**
 * Flag indicating if the app is running in demo mode without real Firebase credentials
 */
export const isDemoModeEnabled = isDemoMode;
