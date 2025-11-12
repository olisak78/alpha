import { useEffect, useState } from 'react';
import { checkAuthStatus } from '@/services/authService';

interface UseAuthRefreshResult {
  isAuthenticated: boolean | null;
  authError: string | null;
  isLoading: boolean;
  retry: () => Promise<void>;
}

/**
 * Hook to check authentication status on component mount
 * and provide retry functionality
 */
export const useAuthRefresh = (): UseAuthRefreshResult => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = async () => {
    setIsLoading(true);
    setAuthError(null);
    
    try {
      const authStatus = await checkAuthStatus();
      
      if (authStatus) {
        setIsAuthenticated(true);
        setAuthError(null);
      } else {
        setIsAuthenticated(false);
        setAuthError('Session expired. Please log in again.');
      }
    } catch (error) {
      setIsAuthenticated(false);
      setAuthError(
        error instanceof Error 
          ? `Authentication failed: ${error.message}`
          : 'Authentication failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const retry = async () => {
    await checkAuth();
  };

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  return {
    isAuthenticated,
    authError,
    isLoading,
    retry
  };
};
