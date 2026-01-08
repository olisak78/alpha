import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { useAuthRefresh } from '@/hooks/useAuthRefresh';
import { setGlobalAuthErrorTrigger, clearGlobalAuthErrorTrigger } from '@/lib/authRefreshService';
import { AuthErrorHandler } from '@/components/AuthErrorHandler';

type AuthErrorContextType = Record<string, never>;

const AuthErrorContext = createContext<AuthErrorContextType | undefined>(undefined);

// Global reference to show auth error from anywhere
let globalShowAuthError: ((message: string) => void) | null = null;

// Export function that can be called from anywhere to show auth error
export const triggerGlobalAuthError = (message: string) => {
  if (globalShowAuthError) {
    globalShowAuthError(message);
  }
};

interface AuthErrorState {
  isVisible: boolean;
  message: string;
  onRetrySuccess?: () => void;
  onRetryError?: (error: Error) => void;
}

interface AuthErrorProviderProps {
  children: ReactNode;
}

export const AuthErrorProvider: React.FC<AuthErrorProviderProps> = ({ children }) => {
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

  // Set global reference so it can be called from anywhere (like queryClient)
  useEffect(() => {
    globalShowAuthError = showAuthError;
    setGlobalAuthErrorTrigger(showAuthError);
    
    return () => {
      globalShowAuthError = null;
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
  }, [globalAuthError, authError.isVisible]);

  const hideAuthError = () => {
    setAuthError({
      isVisible: false,
      message: '',
    });
  };

  return (
    <AuthErrorContext.Provider value={{}}>
      {children}
      
      {/* Global AuthErrorHandler Dialog */}
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
    </AuthErrorContext.Provider>
  );
};
