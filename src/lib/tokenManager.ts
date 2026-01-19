/**
 * Centralized Token Manager
 * 
 * Single source of truth for JWT token management across the application.
 * Prevents duplicate refresh requests by coordinating between all services.
 */

import { getNewBackendUrl } from "@/constants/developer-portal";

// Get backend URL from runtime environment or fallback to localhost for development
const getAuthBaseURL = (): string => {
  const backendUrl = getNewBackendUrl();
  return `${backendUrl}/api/auth`;
};

/**
 * Auth refresh response from backend
 */
interface AuthRefreshResponse {
  accessToken: string;
  expirationTime: number; // Unix timestamp in seconds
}

/**
 * Centralized Token Manager Class
 * 
 * Ensures only one refresh request happens at a time across the entire application
 */
class TokenManager {
  private accessToken: string | null = null;
  private tokenExpirationTime: number | null = null; // Unix timestamp in seconds
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string> | null = null;
  private lastRefreshTime: number = 0;
  private readonly REFRESH_THROTTLE_MS = 5000; // 5 seconds throttle

  /**
   * Get the current access token
   */
  public getToken(): string | null {
    return this.accessToken;
  }

  /**
   * Set the current access token with expiration time
   */
  public setToken(token: string | null, expirationTime: number | null = null): void {
    this.accessToken = token;
    this.tokenExpirationTime = expirationTime;
  }

  /**
   * Check if the current token is expired or will expire soon
   */
  private isTokenExpired(bufferSeconds: number = 60): boolean {
    if (!this.accessToken || !this.tokenExpirationTime) {
      return true;
    }

    // Convert expiration time from seconds to milliseconds and add buffer
    const expirationTimeMs = this.tokenExpirationTime * 1000;
    const currentTimeMs = Date.now();
    const bufferTimeMs = bufferSeconds * 1000;

    // Check if token is expired or will expire within the buffer time
    return currentTimeMs >= (expirationTimeMs - bufferTimeMs);
  }

  /**
   * Check if we have a valid token
   */
  public hasValidToken(bufferSeconds: number = 60): boolean {
    return this.accessToken !== null && !this.isTokenExpired(bufferSeconds);
  }

  /**
   * Check if token needs refresh
   */
  public needsRefresh(bufferSeconds: number = 120): boolean {
    return !this.accessToken || this.isTokenExpired(bufferSeconds);
  }

  /**
   * Get access token, refreshing if necessary
   * This is the single point of entry for all token requests
   */
  public async ensureValidToken(bufferSeconds: number = 60): Promise<string> {
    // FIRST: If we have a valid token, return it immediately - NO REFRESH NEEDED
    if (this.hasValidToken(bufferSeconds)) {
      return this.accessToken!;
    }

    // If a refresh is already in progress, wait for it
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    // Check throttling - if we recently refreshed, don't refresh again immediately
    const now = Date.now();
    if (now - this.lastRefreshTime < this.REFRESH_THROTTLE_MS) {
      // Double-check if we have a token after throttling
      if (this.accessToken && !this.isTokenExpired(bufferSeconds)) {
        return this.accessToken;
      }
      // If no valid token and we're throttled, wait a bit and try again
      await new Promise(resolve => setTimeout(resolve, 100));
      if (this.accessToken && !this.isTokenExpired(bufferSeconds)) {
        return this.accessToken;
      }
    }

    // Start refresh process
    return this.refreshToken();
  }

  /**
   * Force refresh the token bypassing throttling
   * Used when we know the current token is definitely invalid (e.g., 401 response)
   */
  public async forceRefresh(): Promise<string> {
    // Clear throttling state to force a new refresh
    this.lastRefreshTime = 0;
    return this.refreshToken();
  }

  /**
   * Force refresh the token
   */
  private async refreshToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts - atomic check and set
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Set isRefreshing flag and create promise atomically
    this.isRefreshing = true;
    this.refreshPromise = (async () => {
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

        if (!response.ok) {
          throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
        }

        const data: AuthRefreshResponse = await response.json();

        if (!data.accessToken) {
          throw new Error('Invalid token response from server');
        }

        // Store the new token and expiration time using the dedicated method
        this.setToken(data.accessToken, data.expirationTime);
        this.lastRefreshTime = Date.now();

        return data.accessToken;
      } catch (error) {
        console.error('❌ Failed to refresh token:', error);
        this.setToken(null, null);
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Clear the stored token (for logout)
   */
  public clearToken(): void {
    this.setToken(null, null);
    this.lastRefreshTime = 0;
  }

  /**
   * Check if currently refreshing
   */
  public isCurrentlyRefreshing(): boolean {
    return this.isRefreshing;
  }
}

// Export singleton instance
export const tokenManager = new TokenManager();
