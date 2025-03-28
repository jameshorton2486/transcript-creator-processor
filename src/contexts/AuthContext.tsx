
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase/config';
import { useToast } from '@/hooks/use-toast';

export type UserRole = 'admin' | 'viewer' | 'user';

interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: UserRole;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Convert Firebase user to our AuthUser type
  const createAuthUser = (user: User | null): AuthUser | null => {
    if (!user) return null;
    
    // In a real app, you would fetch the user's role from your database
    // For now, we'll assign a default role of 'user'
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      role: 'user'  // Default role
    };
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(createAuthUser(user));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      toast({
        title: "Signed in successfully",
        description: `Welcome, ${result.user.displayName || 'user'}!`,
      });
    } catch (error) {
      console.error("Google sign in error:", error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "There was an error signing in with Google.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign in with email and password
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: "Signed in successfully",
        description: "You have been signed in with your email.",
      });
    } catch (error) {
      console.error("Email sign in error:", error);
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: "Invalid email or password.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
      toast({
        title: "Account created",
        description: "Your account has been created successfully.",
      });
    } catch (error) {
      console.error("Sign up error:", error);
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: "There was an error creating your account.",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast({
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch (error) {
      console.error("Sign out error:", error);
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "There was an error signing out.",
      });
      throw error;
    }
  };

  // Check if user has specific role
  const hasRole = (role: UserRole) => {
    if (!currentUser) return false;
    
    // For admin role, explicitly check
    if (role === 'admin') {
      return currentUser.role === 'admin';
    }
    
    // For viewer role, both viewers and admins can view
    if (role === 'viewer') {
      return ['viewer', 'admin'].includes(currentUser.role);
    }
    
    // For user role, everyone has at least user permissions
    return true;
  };

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUp,
    signOut,
    isAuthenticated: !!currentUser,
    hasRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
