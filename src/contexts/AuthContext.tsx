import { AuthContextType, User } from '@/types/developer-portal';
import { buildUserFromMe } from "@/utils/developer-portal-helpers";
import { checkDualAuthStatus, logoutUser, DualAuthStatus } from '@/services/authService';
import { fetchCurrentUser } from '@/hooks/api/useMembers';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useDualAuthStore } from '@/stores/useDualAuthStore';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    setGithubToolsAuthenticated,
    setGithubWdfAuthenticated,
    isBothAuthenticated,
    reset: resetDualAuth,
  } = useDualAuthStore();

  // Check if user is already authenticated on app load
  useEffect(() => {
    // Don't check auth status if we're on the login page
    // This prevents automatic re-login after logout
    const isLoginPage = window.location.pathname === '/login';
    console.log('🔍 AuthContext: Initial useEffect', {
      isLoginPage,
      pathname: window.location.pathname,
    });

    if (!isLoginPage) {
      console.log('🔍 AuthContext: Not on login page, checking auth status...');
      checkAuthStatusAndSetUser();
    } else {
      // If on login page, just set loading to false
      console.log('🔍 AuthContext: On login page, skipping auth check');
      setIsLoading(false);
    }
  }, []);

  const checkAuthStatusAndSetUser = async () => {
    try {
      console.log('🔍 AuthContext: checkAuthStatusAndSetUser started');
      setIsLoading(true);
      
      // Check both authentication statuses
      const authStatuses = await checkDualAuthStatus();
      console.log('🔍 AuthContext: Auth statuses received:', authStatuses);
      
      // Update Zustand store with authentication statuses
      setGithubToolsAuthenticated(authStatuses.githubtools);
      setGithubWdfAuthenticated(authStatuses.githubwdf);
      console.log('🔍 AuthContext: Updated Zustand store with auth statuses');

      // Only proceed if both authentications are valid
      if (authStatuses.githubtools && authStatuses.githubwdf) {
        console.log('✅ AuthContext: Both auths valid, fetching user...');
        // Fetch user from /users/me
        const me = await fetchCurrentUser();
        console.log('🔍 AuthContext: User fetch result:', me ? 'Success' : 'Failed');
        
        if (me) {
          const user = buildUserFromMe(me);
          setUser(user);
          console.log('✅ AuthContext: User set successfully:', user.name);
        } else {
          setUser(null);
          console.log('❌ AuthContext: Failed to fetch user');
        }
      } else {
        // Not fully authenticated, clear user state
        console.log('❌ AuthContext: Not fully authenticated', authStatuses);
        setUser(null);
      }
    } catch (error) {
      console.error('❌ AuthContext: Error checking auth status:', error);
      setUser(null);
      setGithubToolsAuthenticated(false);
      setGithubWdfAuthenticated(false);
    } finally {
      setIsLoading(false);
      console.log('🔍 AuthContext: checkAuthStatusAndSetUser completed');
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);

      // Wait for both authentications to complete
      // The LoginPage handles the actual authentication flow
      // This method is called after both are complete
      
      // Verify both authentications
      const authStatuses = await checkDualAuthStatus();
      setGithubToolsAuthenticated(authStatuses.githubtools);
      setGithubWdfAuthenticated(authStatuses.githubwdf);

      if (!authStatuses.githubtools || !authStatuses.githubwdf) {
        throw new Error('Both authentications are required to access the portal');
      }

      // After successful dual authentication, refresh user state
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
      
      // Reset dual auth store
      resetDualAuth();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshAuth = async () => {
    try {
      // Check both authentications
      const authStatuses = await checkDualAuthStatus();
      setGithubToolsAuthenticated(authStatuses.githubtools);
      setGithubWdfAuthenticated(authStatuses.githubwdf);

      if (authStatuses.githubtools && authStatuses.githubwdf) {
        // Then fetch current user profile and update UI state
        const me = await fetchCurrentUser();
        if (me) {
          const updatedUser = buildUserFromMe(me);
          setUser(updatedUser);
          try {
            localStorage.removeItem('quick-links');
          } catch (error) {
            console.error('Failed to clear quick-links from localStorage:', error);
          }
        } else {
          setUser(null);
          throw new Error('Failed to fetch current user');
        }
      } else {
        // Not fully authenticated
        setUser(null);
        throw new Error('Both authentications are required');
      }
    } catch (error) {
      console.error('Refresh auth error:', error);
      setUser(null);
      throw error;
    }
  };

  // User is authenticated only if both auth providers are authenticated
  const isAuthenticated = !!user && isBothAuthenticated();
  
  console.log('🔍 AuthContext: isAuthenticated calculation', {
    hasUser: !!user,
    bothAuth: isBothAuthenticated(),
    isAuthenticated,
  });

  const value: AuthContextType = {
    user,
    isAuthenticated,
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