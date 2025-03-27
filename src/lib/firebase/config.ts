
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, MicrosoftAuthProvider } from 'firebase/auth';

// Firebase configuration (user will need to replace with their own config)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-mode",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-domain.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-bucket.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();
const microsoftProvider = new MicrosoftAuthProvider();

export { app, auth, googleProvider, microsoftProvider };
