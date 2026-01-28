/**
 * Authentication Refresh Service
 *
 * Handles authentication token refresh and error detection for React Query.
 * This service is called when cached data exists to ensure authentication is still valid.
 */

import { trackEvent } from "@/utils/analytics";
import { tokenManager } from "./tokenManager";
import { sessionManager } from "./sessionManager";

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


/**
 * Throttled authentication refresh service with centralized token management
 *
 * This function is called when React Query mounts components with cached data
 * to verify that the user's authentication is still valid.
 * Now uses centralized token manager to prevent duplicate refresh requests.
 */
export async function throttledAuthRefresh(): Promise<void> {
  try {
    // Check if we have a valid token (2-minute buffer for periodic checks)
    if (tokenManager.hasValidToken(120)) {
      // Token is still valid, no need to refresh - SKIP ENTIRELY
      return Promise.resolve();
    }
    
    // Use centralized token manager to ensure token validity
    // This will only make a refresh request if needed and not already in progress
    await tokenManager.ensureValidToken(120);
    
  } catch (error) {
    // When token refresh fails, trigger auth error
    triggerSessionExpiredError('Session expired. Please log in again.');
  }
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
    trackSessionExpired();
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

function trackSessionExpired(): void {
  // Get user info and session duration from session manager
  const userInfo = sessionManager.getUserInfo();
  const sessionDuration = sessionManager.getSessionDuration();

  // Build event data
  const eventData: Record<string, any> = {
    lastPage: window.location.pathname,
    timestamp: new Date().toISOString(),
  };

  // Add user info if available
  if (userInfo) {
    if (userInfo.userId) eventData.userId = userInfo.userId;
    if (userInfo.userName) eventData.userName = userInfo.userName;
    if (userInfo.email) eventData.email = userInfo.email;
    if (userInfo.organization) eventData.organization = userInfo.organization;
  }

  // Add session duration if available
  if (sessionDuration !== null) {
    eventData.sessionDuration = sessionDuration;
    eventData.sessionDurationMinutes = Math.floor(sessionDuration / 60);
  }

  // Track the event
  trackEvent('session_expired', eventData);

  // Clear session metadata after tracking
  sessionManager.clearSession();
}
