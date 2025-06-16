import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { auth, onAuthStateChange, loginWithGoogle, logout, handleRedirectResult } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => void;
  signOut: () => Promise<void>;
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
    // Handle redirect result when user returns from Google auth
    handleRedirectResult()
      .then((result) => {
        if (result?.user) {
          console.log('User signed in via redirect:', result.user);
        }
      })
      .catch((error) => {
        console.error('Error handling redirect result:', error);
      });

    // Listen for auth state changes
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        console.log('User authenticated:', user.displayName || user.email);
      }
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = () => {
    loginWithGoogle();
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
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};