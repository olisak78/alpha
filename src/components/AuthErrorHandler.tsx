import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';
import { authService } from '@/services/authService';

interface AuthErrorHandlerProps {
  message: string;
  onRetrySuccess?: () => void;
  onRetryError?: (error: Error) => void;
}

export const AuthErrorHandler: React.FC<AuthErrorHandlerProps> = ({
  message,
  onRetrySuccess,
  onRetryError,
}) => {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      // Use the centralized authentication service
      await authService({
        storeReturnUrl: true, // This will store current URL and redirect back after auth
      });
      
      onRetrySuccess?.();
    } catch (retryError) {
      const errorObject = retryError instanceof Error ? retryError : new Error('Authentication retry failed');
      onRetryError?.(errorObject);
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Dialog open={true}>
      <DialogContent className="sm:max-w-md [&>button]:hidden">
        <DialogHeader>
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-center">Authentication Required</DialogTitle>
          <DialogDescription className="text-center">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-6">
          <Button
            onClick={handleRetry}
            disabled={isRetrying}
            size="default"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Logging in...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4 mr-2" />
                Login
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};



export default AuthErrorHandler;
