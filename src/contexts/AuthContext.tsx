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
    setUserOrganization,
    isBothAuthenticated,
    reset: resetDualAuth,
  } = useDualAuthStore();

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
      
      // Check both authentication statuses
      const authStatuses = await checkDualAuthStatus();
      
      // Update Zustand store with authentication statuses
      setGithubToolsAuthenticated(authStatuses.githubtools);
      setGithubWdfAuthenticated(authStatuses.githubwdf);

      // If GitHub Tools is authenticated, fetch user info to determine organization
      if (authStatuses.githubtools) {
        try {
          const me = await fetchCurrentUser();
          if (me) {
            const user = buildUserFromMe(me);
            setUser(user);
            setUserOrganization(user.organization || null);
            
            // Check if authentication is complete based on organization
            // For sap-cfs users, both authentications are required
            // For non-sap-cfs users, only GitHub Tools is required
            const isAuthComplete = user.organization === 'sap-cfs' 
              ? (authStatuses.githubtools && authStatuses.githubwdf)
              : authStatuses.githubtools;
              
            if (!isAuthComplete) {
              // Partial authentication - user info is available but auth is not complete
              // This is handled by the login page
            }
          } else {
            setUser(null);
          }
        } catch (userError) {
          console.error('Failed to fetch user info:', userError);
          setUser(null);
        }
      } else {
        // Not authenticated at all, clear user state
        setUser(null);
        setUserOrganization(null);
      }
    } catch (error) {
      setUser(null);
      setGithubToolsAuthenticated(false);
      setGithubWdfAuthenticated(false);
      setUserOrganization(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async () => {
    try {
      setIsLoading(true);

      // Wait for authentication to complete
      // The LoginPage handles the actual authentication flow
      // This method is called after authentication is complete
      
      // Verify authentications
      const authStatuses = await checkDualAuthStatus();
      setGithubToolsAuthenticated(authStatuses.githubtools);
      setGithubWdfAuthenticated(authStatuses.githubwdf);

      if (!authStatuses.githubtools) {
        throw new Error('GitHub Tools authentication is required to access the portal');
      }

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

      if (authStatuses.githubtools) {
        // Fetch current user profile and update UI state
        const me = await fetchCurrentUser();
        if (me) {
          const updatedUser = buildUserFromMe(me);
          setUser(updatedUser);
          setUserOrganization(updatedUser.organization || null);
          
          // Check if authentication is complete based on organization
          const isAuthComplete = updatedUser.organization === 'sap-cfs' 
            ? (authStatuses.githubtools && authStatuses.githubwdf)
            : authStatuses.githubtools;
            
          if (!isAuthComplete) {
            throw new Error(updatedUser.organization === 'sap-cfs' 
              ? 'Both GitHub Tools and GitHub WDF authentications are required for sap-cfs users'
              : 'GitHub Tools authentication is required');
          }
          
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
        // Not authenticated at all
        setUser(null);
        setUserOrganization(null);
        throw new Error('GitHub Tools authentication is required');
      }
    } catch (error) {
      console.error('Refresh auth error:', error);
      setUser(null);
      throw error;
    }
  };

  // User is authenticated only if both auth providers are authenticated
  const isAuthenticated = !!user && isBothAuthenticated();
  

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
