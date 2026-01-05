/**
 * Authentication Refresh Service
 *
 * Handles authentication token refresh and error detection for React Query.
 * This service is called when cached data exists to ensure authentication is still valid.
 */

import { getNewBackendUrl } from "@/constants/developer-portal";

// Import the global auth error trigger (will be set by AuthErrorContext)
let globalAuthErrorTrigger: ((message: string) => void) | null = null;

// Track if we've already triggered an auth error to prevent duplicates
let authErrorTriggered = false;
let authErrorResetTimer: NodeJS.Timeout | null = null;

// Function to set the global auth error trigger from AuthErrorContext
export const setGlobalAuthErrorTrigger = (trigger: (message: string) => void) => {
  globalAuthErrorTrigger = trigger;
  // Reset auth error flag when context is set up
  authErrorTriggered = false;
  if (authErrorResetTimer) {
    clearTimeout(authErrorResetTimer);
    authErrorResetTimer = null;
  }
};

// Function to clear the global auth error trigger
export const clearGlobalAuthErrorTrigger = () => {
  globalAuthErrorTrigger = null;
  authErrorTriggered = false;
  if (authErrorResetTimer) {
    clearTimeout(authErrorResetTimer);
    authErrorResetTimer = null;
  }
};

// Helper function to check if an error is authentication-related
export const isAuthError = (error: any): boolean => {
  if (!error) return false;

  // Check error message content
  const message = error.message?.toLowerCase() || '';
  return message.includes('authentication') ||
         message.includes('unauthorized') ||
         message.includes('access token') ||
         message.includes('login required') ||
         message.includes('session expired');
};

// Get backend URL from runtime environment or fallback to localhost for development
const getAuthBaseURL = (): string => {
  const backendUrl = getNewBackendUrl();
  return `${backendUrl}/api/auth`;
};

// Throttling mechanism to prevent multiple simultaneous refresh requests
let lastRefreshTime = 0;
let refreshPromise: Promise<void> | null = null;
const REFRESH_THROTTLE_MS = 5000; // 5 seconds throttle

/**
 * Throttled authentication refresh service
 *
 * This function is called when React Query mounts components with cached data
 * to verify that the user's authentication is still valid.
 */
export async function throttledAuthRefresh(): Promise<void> {
  const now = Date.now();

  // If a refresh is in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  // If we recently refreshed successfully, skip
  if (now - lastRefreshTime < REFRESH_THROTTLE_MS) {
    return Promise.resolve();
  }

  // Create and store the refresh promise to prevent concurrent requests
  refreshPromise = (async () => {
    try {
      const authBaseURL = getAuthBaseURL();
      const response = await fetch(`${authBaseURL}/refresh`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      if (response.ok) {
        lastRefreshTime = now;
      } else {
        // If the refresh endpoint returns a non-OK response, trigger auth error
        triggerSessionExpiredError('Session expired. Please log in again.');
      }

    } catch (error) {
      // When the /refresh fetch request fails, trigger auth error
      triggerSessionExpiredError('Session expired. Please log in again.');
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Trigger global authentication error - DISABLED
 *
 * This function is intentionally disabled to prevent other API failures
 * from triggering the authentication dialog. Only the /refresh
 * endpoint failure should trigger the auth dialog.
 */
export const triggerAuthError = (error: any) => {
  // No-op: Only refresh endpoint failures should trigger auth dialogs
  // This prevents other API failures from affecting AuthErrorHandler
  return;
};

/**
 * Internal function to trigger auth error - only used by throttledAuthRefresh
 */
const triggerSessionExpiredError = (message: string) => {
  if (globalAuthErrorTrigger && !authErrorTriggered) {
    globalAuthErrorTrigger(message);

    // Set flag to prevent duplicate triggers
    authErrorTriggered = true;

    // Reset the flag after 10 seconds to allow new auth errors
    authErrorResetTimer = setTimeout(() => {
      authErrorTriggered = false;
      authErrorResetTimer = null;
    }, 10000);
  }
};
