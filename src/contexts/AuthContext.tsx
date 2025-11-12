import { AuthContextType, User } from '@/types/developer-portal';
import { buildUserFromAuthData } from "@/utils/developer-portal-helpers";
import { authService, checkAuthStatus, logoutUser } from '@/services/authService';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is already authenticated on app load
  useEffect(() => {
    // Don't check auth status if we're on the login page
    // This prevents automatic re-login after logout
    const isLoginPage = window.location.pathname === '/login';

    if (!isLoginPage) {
      checkAuthStatusAndSetUser();
    } else {
      // If on login page, just set loading to false
      setIsLoading(false);
    }
  }, []);

  const checkAuthStatusAndSetUser = async () => {
    try {
      setIsLoading(true);
      const userData = await checkAuthStatus();

      if (userData && userData.profile) {
        const user = buildUserFromAuthData(userData);
        setUser(user);
      } else {
        // No valid auth, clear user state
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);

      // Use centralized authentication service with redirect to home
      await authService({
        returnUrl: '/',
        storeReturnUrl: false, // Don't store current URL, always redirect to home
      });

      // After successful authentication, refresh user state
      await refreshAuth();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);

      // Use centralized logout service
      await logoutUser();

      // Clear user state
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      const userData = await checkAuthStatus();
      
      if (userData && userData.profile) {
        const updatedUser = buildUserFromAuthData(userData);
        setUser(updatedUser);
        try {
          localStorage.removeItem('quick-links');
        } catch (error) {
          console.error('Failed to clear quick-links from localStorage:', error);
        }
      } else {
        // No valid auth data, clear user
        setUser(null);
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Refresh auth error:', error);
      setUser(null);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
