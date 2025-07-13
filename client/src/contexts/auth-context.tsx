import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User, rememberMe?: boolean) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Check localStorage first (remember me)
        let storedToken = localStorage.getItem('userToken');
        let storedUser = localStorage.getItem('userData');

        // If not in localStorage, check sessionStorage
        if (!storedToken || !storedUser) {
          storedToken = sessionStorage.getItem('userToken');
          storedUser = sessionStorage.getItem('userData');
        }

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // Clear invalid data
        localStorage.removeItem('userToken');
        localStorage.removeItem('userData');
        sessionStorage.removeItem('userToken');
        sessionStorage.removeItem('userData');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = (newToken: string, userData: User, rememberMe: boolean = false) => {
    setToken(newToken);
    setUser(userData);

    if (rememberMe) {
      localStorage.setItem('userToken', newToken);
      localStorage.setItem('userData', JSON.stringify(userData));
    } else {
      sessionStorage.setItem('userToken', newToken);
      sessionStorage.setItem('userData', JSON.stringify(userData));
    }

    toast({
      title: "Welcome back!",
      description: `Successfully signed in as ${userData.fullName}`,
    });

    // Redirect to exchange page after successful login
    setLocation('/exchange');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    
    // Clear all storage
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    sessionStorage.removeItem('userToken');
    sessionStorage.removeItem('userData');

    toast({
      title: "Signed out",
      description: "You have been successfully signed out",
    });

    // Redirect to home page
    setLocation('/');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      
      // Update storage
      const storage = localStorage.getItem('userToken') ? localStorage : sessionStorage;
      storage.setItem('userData', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 