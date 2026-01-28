/**
 * Analytics Utility
 * 
 * Handles tracking page views and custom events to Umami via backend proxy.
 * Integrates with the existing tokenManager for JWT authentication.
 */

import { getNewBackendUrl } from '@/constants/developer-portal';
import { tokenManager } from '@/lib/tokenManager';

// Backend URL from runtime environment configuration
const BACKEND_URL = getNewBackendUrl();
const ANALYTICS_ENDPOINT = `${BACKEND_URL}/api/v1/analytics/track`;

/**
 * Analytics payload structure matching backend expectations
 */
interface AnalyticsPayload {
  type: 'event';  // Always 'event' for now
  payload: {
    hostname: string;
    url: string;
    referrer?: string;
    screen?: string;
    language?: string;
    title?: string;
    name?: string;
    data?: Record<string, unknown>;
  };
}

/**
 * Check if analytics is enabled
 * Can be disabled for development or via environment variable
 */
const isAnalyticsEnabled = (): boolean => {
  // Disable in test environment
  if (import.meta.env.MODE === 'test' || process.env.NODE_ENV === 'test') {
    return false;
  }

  // Check if explicitly disabled via window.env
  if (typeof window !== 'undefined' && (window.env as any)?.DISABLE_ANALYTICS === 'true') {
    return false;
  }

  return true;
};

/**
 * Send analytics data to backend
 * 
 * @param payload - Analytics event payload
 * @returns Promise that resolves when tracking completes (or fails silently)
 */
const sendAnalytics = async (payload: AnalyticsPayload): Promise<void> => {
  // Skip if analytics is disabled
  if (!isAnalyticsEnabled()) {
    return;
  }

  // Get JWT token from centralized token manager
  const token = tokenManager.getToken();

  if (!token) {
    // No token available - user might not be authenticated yet
    // Fail silently to not break the app
    console.debug('Analytics: No auth token available - skipping tracking');
    return;
  }

  try {
    // Send analytics event to backend with the COMPLETE payload structure
    const response = await fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload), // ✅ Send the full payload with type and payload fields
      credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.debug('Analytics tracking failed:', response.status, errorText);
    } else {
      console.debug('Analytics tracked:', payload.payload.url, payload.payload.name || 'pageview');
    }
  } catch (error) {
    // Fail silently - analytics failures should never break the app
    console.debug('Analytics tracking error:', error);
  }
};

/**
 * Track a page view
 * 
 * @param url - Page URL to track (defaults to current pathname)
 * 
 * @example
 * // Track current page
 * trackPageView();
 * 
 * @example
 * // Track specific page
 * trackPageView('/teams/platform-engineering');
 */
export const trackPageView = (url: string = window.location.pathname): void => {
  const payload: AnalyticsPayload = {
    type: 'event', // ✅ Include type field
    payload: {     // ✅ Wrap data in payload object
      hostname: window.location.hostname,
      url,
      referrer: document.referrer,
      screen: `${window.screen.width}x${window.screen.height}`,
      language: navigator.language,
      title: document.title,
    },
  };

  // Send asynchronously without blocking the UI
  sendAnalytics(payload);
};

/**
 * Track a custom event
 * 
 * @param eventName - Name of the event to track
 * @param eventData - Optional additional data to include with the event
 * 
 * @example
 * // Track button click
 * trackEvent('deploy_button_clicked', {
 *   environment: 'production',
 *   component: 'ui-service',
 * });
 * 
 * @example
 * // Track feature usage
 * trackEvent('plugin_installed', {
 *   pluginId: 'slack-notifications',
 *   version: '1.2.0',
 * });
 */
export const trackEvent = (
  eventName: string,
  eventData: Record<string, unknown> = {}
): void => {
  const payload: AnalyticsPayload = {
    type: 'event',  
    payload: {      
      hostname: window.location.hostname,
      url: window.location.pathname,
      name: eventName,
      data: eventData,
    },
  };

  // Send asynchronously without blocking the UI
  sendAnalytics(payload);
};

/**
 * Utility to track component mount/view
 * Useful for tracking when users view specific components or features
 * 
 * @param componentName - Name of the component being viewed
 * @param metadata - Optional metadata about the view context
 * 
 * @example
 * // In a useEffect
 * useEffect(() => {
 *   trackComponentView('PluginMarketplace', { category: 'ai' });
 * }, []);
 */
export const trackComponentView = (
  componentName: string,
  metadata: Record<string, unknown> = {}
): void => {
  trackEvent('component_viewed', {
    component: componentName,
    ...metadata,
  });
};

/**
 * Utility to track errors for monitoring
 * Useful for tracking client-side errors
 * 
 * @param error - Error object or error message
 * @param context - Optional context about where the error occurred
 * 
 * @example
 * try {
 *   // Some operation
 * } catch (error) {
 *   trackError(error, { operation: 'fetchTeams', teamId: '123' });
 * }
 */
export const trackError = (
  error: Error | string,
  context: Record<string, unknown> = {}
): void => {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  trackEvent('client_error', {
    error: errorMessage,
    stack: errorStack,
    ...context,
  });
};