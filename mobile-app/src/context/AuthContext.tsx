import React, { createContext, useState, useContext, useEffect } from 'react';
import { getAuthToken } from '../services/api';
import { signIn as authSignIn, signUp as authSignUp, signOut as authSignOut, getCurrentUser, User, SignInData, SignUpData } from '../services/authService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (data: SignInData) => Promise<{ success: boolean; error?: string }>;
  signUp: (data: SignUpData) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        const { user: currentUser } = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (data: SignInData) => {
    const result = await authSignIn(data);
    if (result.success) {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
    }
    return result;
  };

  const signUp = async (data: SignUpData) => {
    const result = await authSignUp(data);
    if (result.success) {
      const { user: currentUser } = await getCurrentUser();
      setUser(currentUser);
    }
    return result;
  };

  const signOut = async () => {
    await authSignOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        signIn,
        signUp,
        signOut,
      }}
    >
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
