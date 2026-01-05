import React, { useState, useEffect } from 'react';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';
import { setGlobalAuthErrorTrigger, clearGlobalAuthErrorTrigger } from '@/lib/authRefreshService';
import { AuthErrorHandler } from '@/components/AuthErrorHandler';

interface AuthErrorState {
  isVisible: boolean;
  message: string;
  onRetrySuccess?: () => void;
  onRetryError?: (error: Error) => void;
}

/**
 * GlobalAuthErrorHandler Component
 * 
 * This component manages global authentication error dialogs.
 * It's not a context provider, but rather a component that:
 * 1. Listens for auth errors from various sources (React Query, hooks, etc.)
 * 2. Displays a single, centralized AuthErrorHandler dialog
 * 3. Prevents duplicate dialogs through the authRefreshService
 */
export const GlobalAuthErrorHandler: React.FC = () => {
  const [authError, setAuthError] = useState<AuthErrorState>({
    isVisible: false,
    message: '',
  });

  // Use the global auth refresh hook to detect authentication errors
  const { isAuthenticated, authError: globalAuthError, retry } = useAuthRefresh();

  const showAuthError = (
    message: string, 
    onRetrySuccess?: () => void, 
    onRetryError?: (error: Error) => void
  ) => {
    setAuthError({
      isVisible: true,
      message,
      onRetrySuccess,
      onRetryError,
    });
  };

  // Register this component as the global auth error handler
  useEffect(() => {
    setGlobalAuthErrorTrigger(showAuthError);
    
    return () => {
      clearGlobalAuthErrorTrigger();
    };
  }, []);

  // Automatically show auth error when global auth error is detected
  useEffect(() => {
    if (globalAuthError && !authError.isVisible) {
      showAuthError(
        globalAuthError,
        () => {
          // Retry authentication was successful, the hook will update automatically
        },
        (error) => {
          console.error('Authentication retry failed:', error);
        }
      );
    }
  }, [globalAuthError, authError.isVisible, showAuthError]);

  const hideAuthError = () => {
    setAuthError({
      isVisible: false,
      message: '',
    });
  };

  // Render the auth error dialog when needed
  return (
    <>
      {authError.isVisible && (
        <AuthErrorHandler
          message={authError.message}
          onRetrySuccess={() => {
            authError.onRetrySuccess?.();
            hideAuthError();
          }}
          onRetryError={(error) => {
            authError.onRetryError?.(error);
          }}
        />
      )}
    </>
  );
};
