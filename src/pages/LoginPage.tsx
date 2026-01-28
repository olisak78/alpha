import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Github, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useDualAuthStore } from '@/stores/useDualAuthStore';
import { authService, authServiceWdf } from '@/services/authService';
import { fetchCurrentUser } from '@/hooks/api/useMembers';
import { buildUserFromMe } from '@/utils/developer-portal-helpers';
import { trackEvent } from '@/utils/analytics';
import { sessionManager } from '@/lib/sessionManager';

const LoginPage: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  const {
    isGithubToolsAuthenticated,
    isGithubWdfAuthenticated,
    isGithubToolsLoading,
    isGithubWdfLoading,
    githubToolsError,
    githubWdfError,
    userOrganization,
    setGithubToolsAuthenticated,
    setGithubWdfAuthenticated,
    setGithubToolsLoading,
    setGithubWdfLoading,
    setGithubToolsError,
    setGithubWdfError,
    setUserOrganization,
    isBothAuthenticated,
    requiresWdfAuth,
  } = useDualAuthStore();

  // Track successful login and redirect when both authentications complete
  useEffect(() => {
    const trackLoginAndRedirect = async () => {
      if (isBothAuthenticated()) {
        try {
          // Fetch user information to include in analytics
          const userMe = await fetchCurrentUser();
          const user = buildUserFromMe(userMe);
          sessionManager.startSession(user);  // Start tracking session for analytics

          // Track single login  event with comprehensive user data
          trackEvent('user_login', {
            userId: user.id,
            userName: user.name,
            email: user.email,
            organization: user.organization || 'unknown',
            isSapCfs: user.organization === 'sap-cfs',
            providersUsed: requiresWdfAuth()
              ? ['githubtools', 'githubwdf']
              : ['githubtools'],
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Failed to fetch user data for analytics:', error);

          // Still track login even if user fetch fails, but with limited data
          trackEvent('user_login', {
            organization: userOrganization || 'unknown',
            isSapCfs: userOrganization === 'sap-cfs',
            providersUsed: requiresWdfAuth()
              ? ['githubtools', 'githubwdf']
              : ['githubtools'],
            timestamp: new Date().toISOString(),
          });
        }

        // Clear the justLoggedOut flag before redirect
        sessionStorage.removeItem('justLoggedOut');

        // Small delay to ensure analytics event is sent
        const timer = setTimeout(() => {
          window.location.href = '/';
        }, 500);

        return () => clearTimeout(timer);
      }
    };

    trackLoginAndRedirect();
  }, [isGithubToolsAuthenticated, isGithubWdfAuthenticated, userOrganization, isBothAuthenticated, requiresWdfAuth]);

  // Redirect if already fully authenticated
  if (isAuthenticated && isBothAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const fetchUserOrganization = async () => {
    try {
      const userMe = await fetchCurrentUser();
      const user = buildUserFromMe(userMe);
      setUserOrganization(user.organization || null);
    } catch (userError) {
      console.error('Failed to fetch user organization:', userError);
    }
  };

  const handleGithubToolsLogin = async () => {
    if (isGithubToolsAuthenticated) {
      return;
    }

    try {
      setGithubToolsLoading(true);
      setGithubToolsError(null);

      // Clear the justLoggedOut flag when starting login
      sessionStorage.removeItem('justLoggedOut');

      await authService({
        returnUrl: undefined,
        storeReturnUrl: false,
      });

      setGithubToolsAuthenticated(true);

      // After successful GitHub Tools authentication, fetch user info to get organization
      await fetchUserOrganization();
    } catch (error) {
      console.error('SAP GitHub Tools login failed:', error);
      setGithubToolsError(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setGithubToolsLoading(false);
    }
  };

  const handleGithubWdfLogin = async () => {
    if (isGithubWdfAuthenticated) {
      return;
    }

    try {
      setGithubWdfLoading(true);
      setGithubWdfError(null);

      // Clear the justLoggedOut flag when starting login
      sessionStorage.removeItem('justLoggedOut');

      await authServiceWdf({
        returnUrl: undefined,
        storeReturnUrl: false,
      });

      setGithubWdfAuthenticated(true);
    } catch (error) {
      console.error('SAP GitHub WDF login failed:', error);
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

  // Determine the description text based on user organization
  const getDescriptionText = () => {
    if (showCompletionMessage) {
      return requiresWdfAuth()
        ? 'Please complete the second authentication to access the portal'
        : 'Authentication complete! Redirecting...';
    }

    if (isGithubToolsAuthenticated && userOrganization !== null) {
      return requiresWdfAuth()
        ? 'Complete both authentications to access the portal'
        : 'GitHub Tools authentication complete! You can now access the portal.';
    }

    return 'Sign in with GitHub Tools to access the portal';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Developer Portal</CardTitle>
          <CardDescription>
            {getDescriptionText()}
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
                  SAP GitHub Tools - Authenticated
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Github className="h-5 w-5" />
                  Sign in with SAP GitHub Tools
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

          {/* GitHub WDF Authentication Button - Only show for sap-cfs users */}
          {(requiresWdfAuth() || userOrganization === null) && (
            <div className="space-y-2">
              <Button
                onClick={handleGithubWdfLogin}
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
                    SAP GitHub WDF - Authenticated
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Github className="h-5 w-5" />
                    Sign in with SAP GitHub WDF
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
