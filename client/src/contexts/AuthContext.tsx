import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { 
  auth, 
  onAuthStateChange, 
  loginWithGoogle, 
  logout, 
  handleRedirectResult,
  signUpWithEmail,
  signInWithEmail,
  resetPassword,
  getAuthErrorMessage
} from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  signUpWithEmail: (email: string, password: string, fullName: string, rememberMe?: boolean) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  getErrorMessage: (errorCode: string) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: () => void;

    const initializeAuth = async () => {
      try {
        // Handle redirect result when user returns from Google auth
        const result = await handleRedirectResult();
        if (result?.user) {
          console.log('User signed in via redirect:', result.user);
          setUser(result.user);
        }
      } catch (error: any) {
        // Silently handle domain authorization errors - they're expected until Firebase is configured
        if (error.code !== 'auth/unauthorized-domain') {
          console.error('Error handling redirect result:', error);
        }
      }

      // Listen for auth state changes
      unsubscribe = onAuthStateChange((user) => {
        setUser(user);
        setLoading(false);
        if (user) {
          console.log('User authenticated:', user.displayName || user.email);
        }
      });
    };

    initializeAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      await loginWithGoogle();
    } catch (error: any) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  };

  const handleSignInWithEmail = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      await signInWithEmail(email, password, rememberMe);
    } catch (error: any) {
      throw error;
    }
  };

  const handleSignUpWithEmail = async (email: string, password: string, fullName: string, rememberMe: boolean = false) => {
    try {
      await signUpWithEmail(email, password, fullName, rememberMe);
    } catch (error: any) {
      throw error;
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      await resetPassword(email);
    } catch (error: any) {
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await logout();
      console.log('User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    resetPassword: handleResetPassword,
    signOut,
    getErrorMessage: getAuthErrorMessage,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};