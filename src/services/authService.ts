import { getNewBackendUrl } from "@/constants/developer-portal";

// Get backend URL from runtime environment or fallback to localhost for development
const backendUrl = getNewBackendUrl();

export interface AuthServiceOptions {
  returnUrl?: string;
  storeReturnUrl?: boolean;
}

export type AuthProvider = 'githubtools' | 'githubwdf';

export interface DualAuthStatus {
  githubtools: boolean;
  githubwdf: boolean;
}

/**
 * Generic authentication service that handles OAuth popup flow
 * @param provider - The authentication provider ('githubtools' or 'githubwdf')
 * @param options - Authentication options
 */
const createAuthService = (provider: AuthProvider) => {
  return async (options: AuthServiceOptions = {}): Promise<void> => {
    const { returnUrl, storeReturnUrl = true } = options;

    // Store return URL if requested
    if (storeReturnUrl) {
      const urlToStore = returnUrl || window.location.href;
      sessionStorage.setItem('authReturnUrl', urlToStore);
    }

    const authUrl = `${backendUrl}/api/auth/${provider}/start`;

    // Open popup for OAuth flow
    const popup = window.open(
      authUrl,
      `auth-popup-${provider}`,
      'width=500,height=600,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
    );

    if (!popup) {
      // Fallback: redirect to auth URL in same window
      window.location.href = authUrl;
      return;
    }

    return new Promise<void>((resolve, reject) => {
      // Listen for the popup to close
      const checkClosed = setInterval(async () => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);

          // Check if authentication was successful by calling refresh
          try {
            const response = await fetch(`${backendUrl}/api/auth/refresh`, {
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
              },
            });

            if (response.ok) {
              // Authentication successful
              resolve();
            } else {
              reject(new Error(`Authentication failed for ${provider} after popup closed`));
            }
          } catch (error) {
            reject(error);
          }
        }
      }, 1000);

      // Also listen for messages from the popup (if the backend sends them)
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== backendUrl) return;

        if (event.data.type === 'auth-result') {
          popup.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);

          if (event.data.success) {
            resolve();
          } else {
            reject(new Error(`Authentication failed for ${provider}`));
          }
        }
      };

      window.addEventListener('message', messageListener);

      // Cleanup and timeout after 5 minutes
      setTimeout(() => {
        if (!popup.closed) {
          popup.close();
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          reject(new Error(`Authentication timeout for ${provider}`));
        }
      }, 300000);
    });
  };
};

// Create specific auth services for each provider
export const authService = createAuthService('githubtools');
export const authServiceWdf = createAuthService('githubwdf');

export const checkAuthStatus = async () => {
  try {
    // Check if we just logged out (flag in sessionStorage)
    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    if (justLoggedOut) {
      // Remove the flag and don't check auth
      sessionStorage.removeItem('justLoggedOut');
      return null;
    }

    const response = await fetch(`${backendUrl}/api/auth/refresh`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (response.ok) {
      return await response.json();
    }

    return null;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return null;
  }
};

/**
 * Check authentication status for both providers
 * Returns an object indicating which providers are authenticated
 */
export const checkDualAuthStatus = async (): Promise<DualAuthStatus> => {
  try {
    const justLoggedOut = sessionStorage.getItem('justLoggedOut');
    if (justLoggedOut) {
      sessionStorage.removeItem('justLoggedOut');
      return { githubtools: false, githubwdf: false };
    }

    const response = await fetch(`${backendUrl}/api/auth/refresh`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (response.ok) {
      const data = await response.json();
      
      // Check if the response includes auth status for both providers
      // If backend provides explicit status, use it
      // Otherwise, if backend returned an accessToken, assume both auths are valid
      // (backend wouldn't issue token unless both authentications succeeded)
      const hasAccessToken = !!data.accessToken;
      
      const authStatus = {
        githubtools: data.githubtools ?? (hasAccessToken || data.authenticated || false),
        githubwdf: data.githubwdf ?? (hasAccessToken || data.authenticated || false),
      };
      
      return authStatus;
    }

    return { githubtools: false, githubwdf: false };
  } catch (error) {
    return { githubtools: false, githubwdf: false };
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await fetch(`${backendUrl}/api/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    // Clear session and authentication-related data only
    try {
      // Always clear all sessionStorage
      sessionStorage.clear();

      // Only clear specific authentication-related localStorage keys
      // This preserves user preferences like theme that should persist across login/logout
      const keysToRemove = [
        'quick-links',        // User's quick links (may be user-specific)
        'auth-token',         // Any cached auth tokens (if exists)
        'user-data',          // Cached user profile data (if exists)
        'auth-state',         // Any auth state data (if exists)
      ];

      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (err) {
          console.error(`Failed to remove localStorage key "${key}":`, err);
        }
      });

      // Explicitly preserved localStorage keys:
      // - 'developer-portal-theme': User's theme preference (light/dark/system)
      // - Any other user preferences that should persist across sessions

    } catch (error) {
      console.error('Failed to clear storage:', error);
    }

    // Set flag to prevent auth check after redirect
    sessionStorage.setItem('justLoggedOut', 'true');

    // Redirect to login page
    window.location.href = '/login';
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails, clear local state and redirect
    try {
      sessionStorage.clear();
      localStorage.clear();
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
    // Set flag to prevent auth check after redirect
    sessionStorage.setItem('justLoggedOut', 'true');
    window.location.href = '/login';
  }
};