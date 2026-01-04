import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDualAuthStore } from '@/stores/useDualAuthStore';
import { authService, authServiceWdf } from '@/services/authService';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  
  const {
    isGithubToolsAuthenticated,
    isGithubWdfAuthenticated,
    isGithubToolsLoading,
    isGithubWdfLoading,
    githubToolsError,
    githubWdfError,
    setGithubToolsAuthenticated,
    setGithubWdfAuthenticated,
    setGithubToolsLoading,
    setGithubWdfLoading,
    setGithubToolsError,
    setGithubWdfError,
    isBothAuthenticated,
  } = useDualAuthStore();

  console.log('🔐 LoginPage RENDER:', {
    isAuthenticated,
    isLoading,
    isGithubToolsAuthenticated,
    isGithubWdfAuthenticated,
    bothAuth: isBothAuthenticated(),
  });

  // Redirect to home when both authentications are complete
  useEffect(() => {
    console.log('🔄 LoginPage useEffect - Auth Status:', {
      isGithubToolsAuthenticated,
      isGithubWdfAuthenticated,
      isBothAuthenticated: isBothAuthenticated(),
    });
    
    if (isBothAuthenticated() && isGithubToolsAuthenticated && isGithubWdfAuthenticated) {
      console.log('✅ Both authentications complete! Redirecting in 1 second...');
      // Small delay to show success message
      const timer = setTimeout(() => {
        console.log('🚀 Executing redirect to /');
        window.location.href = '/';
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isGithubToolsAuthenticated, isGithubWdfAuthenticated, isBothAuthenticated]);

  // Redirect if already fully authenticated
  if (isAuthenticated && isBothAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const handleGithubToolsLogin = async () => {
    if (isGithubToolsAuthenticated) {
      console.log('⏭️  GitHub Tools already authenticated, skipping');
      return;
    }
    
    try {
      console.log('🔵 Starting GitHub Tools authentication...');
      setGithubToolsLoading(true);
      setGithubToolsError(null);
      
      await authService({
        returnUrl: undefined,
        storeReturnUrl: false,
      });
      
      console.log('✅ GitHub Tools authentication successful!');
      setGithubToolsAuthenticated(true);
    } catch (error) {
      console.error('❌ GitHub Tools login failed:', error);
      setGithubToolsError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setGithubToolsLoading(false);
    }
  };

  const handleGithubWdfLogin = async () => {
    if (isGithubWdfAuthenticated) {
      console.log('⏭️  GitHub WDF already authenticated, skipping');
      return;
    }
    
    try {
      console.log('🟢 Starting GitHub WDF authentication...');
      setGithubWdfLoading(true);
      setGithubWdfError(null);
      
      await authServiceWdf({
        returnUrl: undefined,
        storeReturnUrl: false,
      });
      
      console.log('✅ GitHub WDF authentication successful!');
      setGithubWdfAuthenticated(true);
    } catch (error) {
      console.error('❌ GitHub WDF login failed:', error);
      setGithubWdfError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setGithubWdfLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const showCompletionMessage = (isGithubToolsAuthenticated || isGithubWdfAuthenticated) 
    && !isBothAuthenticated();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Developer Portal</CardTitle>
          <CardDescription>
            {showCompletionMessage 
              ? 'Please complete the second authentication to access the portal'
              : 'Complete both authentications to access the portal'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GitHub Tools Authentication Button */}
          <div className="space-y-2">
            <Button
              onClick={handleGithubToolsLogin}
              disabled={isGithubToolsLoading || isGithubToolsAuthenticated}
              className="w-full h-12 text-base"
              variant={isGithubToolsAuthenticated ? "outline" : "default"}
            >
              {isGithubToolsLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Connecting...
                </div>
              ) : isGithubToolsAuthenticated ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  GitHub Tools - Authenticated
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Sign in with GitHub Tools
                </div>
              )}
            </Button>
            {githubToolsError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{githubToolsError}</span>
              </div>
            )}
          </div>

          {/* GitHub WDF Authentication Button */}
          <div className="space-y-2">
            <Button
              onClick={handleGithubWdfLogin}
              disabled={isGithubWdfLoading || isGithubWdfAuthenticated}
              className="w-full h-12 text-base"
              variant={isGithubWdfAuthenticated ? "outline" : "default"}
            >
              {isGithubWdfLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                  Connecting...
                </div>
              ) : isGithubWdfAuthenticated ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  GitHub WDF - Authenticated
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Sign in with GitHub WDF
                </div>
              )}
            </Button>
            {githubWdfError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{githubWdfError}</span>
              </div>
            )}
          </div>

          {/* Completion Message */}
          {showCompletionMessage && (
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200 text-center">
                {isGithubToolsAuthenticated && !isGithubWdfAuthenticated && (
                  <>✓ GitHub Tools authenticated. Please sign in with GitHub WDF to continue.</>
                )}
                {isGithubWdfAuthenticated && !isGithubToolsAuthenticated && (
                  <>✓ GitHub WDF authenticated. Please sign in with GitHub Tools to continue.</>
                )}
              </p>
            </div>
          )}

          {/* Both Complete - Redirecting Message */}
          {isBothAuthenticated() && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-sm text-green-800 dark:text-green-200 text-center font-medium">
                ✓ Both authentications complete. Redirecting to portal...
              </p>
            </div>
          )}

          <div className="text-center text-sm text-muted-foreground mt-6">
            <p>
              By signing in, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginPage;