import { getNewBackendUrl } from '@/constants/developer-portal';
import type { ApiError } from '../types/api';

/**
 * Enhanced Error with API details
 * Extends the base Error class to include API-specific information
 */
interface ApiClientError extends Error {
  status?: number;
  details?: Record<string, unknown>;
  apiError?: ApiError;
}

/**
 * API Client Configuration
 * 
 * This client wraps the native fetch API and provides:
 * - Automatic JWT token management from refresh endpoint
 * - Automatic authentication header injection (Bearer token)
 * - Automatic token refresh on 401 errors
 * - Centralized error handling
 * - Type-safe request/response handling
 */

const backendUrl = getNewBackendUrl();
/**
 * Base configuration for the API client
 */
const API_CONFIG = {
  get baseURL() { return `${backendUrl}/api/v1`; },
  get authBaseURL() { return `${backendUrl}/api/auth`; },
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
} as const;

/**
 * HTTP Methods supported by the API
 */
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

/**
 * Request configuration options
 */
interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  signal?: AbortSignal;
}

/**
 * Enhanced fetch options
 */
interface FetchOptions extends RequestInit {
  headers: Record<string, string>;
}

/**
 * Auth refresh response from backend
 */
interface AuthRefreshResponse {
  accessToken: string;
  expiresInSeconds: number;
  tokenType: string;
  valid: boolean;
  profile?: {
    id?: number;
    username?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  };
  scope?: string;
}

/**
 * API Client class
 * 
 * Provides a clean interface for making API requests with built-in
 * JWT authentication, error handling, and retry logic.
 * 
 * IMPORTANT: This client automatically fetches and manages JWT tokens.
 * The token is obtained from the refresh endpoint and sent as Authorization header.
 * 
 * @example
 * const client = new ApiClient();
 * 
 * // GET request (token automatically included)
 * const teams = await client.get<Team[]>('/teams/all');
 * 
 * // POST request
 * const newTeam = await client.post<Team>('/teams', { name: 'New Team' });
 * 
 * // With query params
 * const filtered = await client.get<Team[]>('/teams/all', {
 *   params: { organization_id: '123', page: 1 }
 * });
 */
export class ApiClient {
  private baseURL: string;
  private authBaseURL: string;
  private defaultHeaders: Record<string, string>;
  private accessToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshPromise: Promise<string> | null = null;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.authBaseURL = API_CONFIG.authBaseURL;
    this.defaultHeaders = { ...API_CONFIG.headers };
  }

  /**
   * Build full URL with query parameters
   * 
   * @param endpoint - API endpoint (e.g., '/teams')
   * @param params - Query parameters
   * @returns Full URL with query string
   */
  private buildURL(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): string {
    const url = new URL(`${this.baseURL}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  /**
   * Build headers for request
   * Includes JWT token in Authorization header if available
   * 
   * @param customHeaders - Additional headers to include
   * @returns Complete headers object
   */
  private buildHeaders(
    customHeaders?: Record<string, string>
  ): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...customHeaders,
    };

    // Add Authorization header if we have a token
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  /**
   * Get access token from refresh endpoint
   * This fetches a new JWT token using the httpOnly cookie authentication
   * 
   * @returns JWT access token
   */
  private async getAccessToken(): Promise<string> {
    // Prevent multiple simultaneous refresh attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const response = await fetch(
          `${this.authBaseURL}/githubtools/refresh?env=development`,
          {
            method: 'GET',
            credentials: 'include', // Send httpOnly cookies
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Token refresh failed: ${response.status} ${response.statusText}`);
        }

        const data: AuthRefreshResponse = await response.json();

        if (!data.valid || !data.accessToken) {
          throw new Error('Invalid token response from server');
        }

        // Store the access token
        this.accessToken = data.accessToken;


        return data.accessToken;
      } catch (error) {
        console.error('❌ Failed to refresh token:', error);
        this.accessToken = null;
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  /**
   * Ensure we have a valid access token
   * Fetches token if we don't have one
   * 
   * @returns JWT access token
   */
  private async ensureToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }

    return await this.getAccessToken();
  }

  /**
   * Make an HTTP request with automatic auth and error handling
   * 
   * @param endpoint - API endpoint (e.g., '/teams')
   * @param config - Request configuration
   * @returns Parsed response data
   */
  private async request<T>(
    endpoint: string,
    config: RequestConfig
  ): Promise<T> {
    const { method, headers: customHeaders, body, params, signal } = config;

    // Ensure we have an access token before making the request
    try {
      await this.ensureToken();
    } catch (error) {
      // Create a more specific authentication error that can be caught by AuthErrorHandler

      const authError = new Error('Failed to load data. Authentication required.') as ApiClientError;

      authError.status = 401;
      authError.details = { originalError: error instanceof Error ? error.message : String(error) };
      throw authError;
    }

    // Build the full URL with query parameters
    const url = this.buildURL(endpoint, params);

    // Build headers with auth token
    const headers = this.buildHeaders(customHeaders);

    // Build fetch options
    const fetchOptions: FetchOptions = {
      method,
      headers,
      signal,
      credentials: 'include', // Still include cookies for potential backend needs
    };

    // Add body for non-GET requests
    if (body !== undefined && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      // Make the request
      // let response = await fetch(url, fetchOptions);
      let response: Response;

      try {
        response = await fetch(url, fetchOptions);
      } catch (err) {
        throw new Error("Network error");
      }
      if (response.status === 502) {
        throw new Error("Found 502 error");
      }

      // Handle 401 Unauthorized - token expired or invalid
      if (response.status === 401) {
        console.log('Received 401, attempting token refresh...');

        try {
          // Force refresh the token
          await this.getAccessToken();

          // Retry the original request with new token
          const newHeaders = this.buildHeaders(customHeaders);
          fetchOptions.headers = newHeaders;

          response = await fetch(url, fetchOptions);

          if (response.status === 401) {
            // Still 401 after refresh - authentication truly failed
            throw new Error('Authentication failed after token refresh. Please login again.');
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);
          this.accessToken = null; // Clear invalid token
          throw new Error('Authentication failed: Unable to refresh token. Please login again.');
        }
      }

      // Handle other error responses
      if (!response.ok) {
        const apiError = await this.createApiError(response);
        // Create a proper Error object with the API error details
        const error = new Error(apiError.message || 'API request failed') as ApiClientError;
        error.status = apiError.status;
        error.details = apiError.details;
        error.apiError = apiError;
        throw error;
      }

      // Handle 204 No Content (common for DELETE requests)
      if (response.status === 204) {
        return undefined as T;
      }

      // Parse and return JSON response
      return await response.json();
    } catch (error) {
      // Re-throw API errors as-is
      if (error instanceof Error && 'status' in error) {
        throw error;
      }

      // Handle network errors and other exceptions
      if (error instanceof Error) {
        throw new Error(`Session expired. Please log in again.`);
      }

      throw new Error('An unknown error occurred');
    }
  }

  /**
   * Create a standardized API error
   * 
   * @param response - Fetch response
   * @returns ApiError object
   */
  private async createApiError(response: Response): Promise<ApiError> {
    let errorBody: any = {};

    try {
      errorBody = await response.json();
    } catch {
      // Response body is not JSON or is empty
    }

    const error: ApiError = {
      status: response.status,
      message: errorBody.message || errorBody.error || response.statusText,
      details: errorBody.details || errorBody.error || undefined,
    };

    return error;
  }

  // ============================================================================
  // PUBLIC API METHODS
  // ============================================================================

  /**
   * GET request
   * 
   * @param endpoint - API endpoint
   * @param options - Query params and request options
   * @returns Response data
   * 
   * @example
   * // Simple GET
   * const teams = await client.get<Team[]>('/teams/all');
   * 
   * @example
   * // With query parameters
   * const filtered = await client.get<TeamListResponse>('/teams/all', {
   *   params: { 
   *     organization_id: '123',
   *     page: 1,
   *     page_size: 20
   *   }
   * });
   */
  public async get<T>(
    endpoint: string,
    options?: {
      params?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    }
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      params: options?.params,
      headers: options?.headers,
      signal: options?.signal,
    });
  }

  /**
   * POST request
   * 
   * @param endpoint - API endpoint
   * @param data - Request body
   * @param options - Optional headers
   * @returns Response data
   * 
   * @example
   * const newTeam = await client.post<Team>('/teams', {
   *   name: 'new-team',
   *   display_name: 'New Team',
   *   group_id: '123',
   *   status: 'active'
   * });
   */
  public async post<T>(
    endpoint: string,
    data?: unknown,
    options?: {
      headers?: Record<string, string>;
      signal?: AbortSignal;
    }
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data,
      headers: options?.headers,
      signal: options?.signal,
    });
  }

  /**
   * PUT request
   * 
   * @param endpoint - API endpoint
   * @param data - Request body (full update)
   * @param options - Optional headers
   * @returns Response data
   * 
   * @example
   * const updatedTeam = await client.put<Team>('/teams/123', {
   *   display_name: 'Updated Name',
   *   description: 'New description'
   * });
   */
  public async put<T>(
    endpoint: string,
    data?: unknown,
    options?: {
      headers?: Record<string, string>;
      signal?: AbortSignal;
    }
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data,
      headers: options?.headers,
      signal: options?.signal,
    });
  }

  /**
   * PATCH request
   * 
   * @param endpoint - API endpoint
   * @param data - Request body (partial update)
   * @param options - Optional headers
   * @returns Response data
   * 
   * @example
   * const patchedTeam = await client.patch<Team>('/teams/123', {
   *   status: 'archived'
   * });
   */
  public async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: {
      headers?: Record<string, string>;
      signal?: AbortSignal;
    }
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data,
      headers: options?.headers,
      signal: options?.signal,
    });
  }

  /**
   * DELETE request
   * 
   * @param endpoint - API endpoint
   * @param options - Optional headers
   * @returns Response data (usually void for 204 responses)
   * 
   * @example
   * await client.delete('/teams/123');
   */
  public async delete<T = void>(
    endpoint: string,
    options?: {
      headers?: Record<string, string>;
      signal?: AbortSignal;
    }
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: options?.headers,
      signal: options?.signal,
    });
  }

  /**
   * Manually clear the stored access token
   * Useful for logout scenarios
   */
  public clearToken(): void {
    this.accessToken = null;
  }

  /**
   * Check if client has an access token
   */
  public hasToken(): boolean {
    return this.accessToken !== null;
  }

  /**
   * Get the current access token
   * Ensures token is fetched if not present
   *
   * @returns JWT access token
   */
  public async getToken(): Promise<string> {
    return await this.ensureToken();
  }

  /**
   * Fetch binary data (like images) with authentication
   *
   * @param endpoint - API endpoint
   * @param options - Optional parameters and headers
   * @returns Blob data
   *
   * @example
   * const imageBlob = await client.getBinary('/github/asset', {
   *   params: { url: 'https://github.com/...' }
   * });
   * const imageUrl = URL.createObjectURL(imageBlob);
   */
  public async getBinary(
    endpoint: string,
    options?: {
      params?: Record<string, string | number | boolean | undefined>;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    }
  ): Promise<Blob> {
    await this.ensureToken();

    const url = this.buildURL(endpoint, options?.params);
    const headers = this.buildHeaders(options?.headers);

    const response = await fetch(url, {
      method: 'GET',
      headers,
      signal: options?.signal,
    });

    if (!response.ok) {
      const apiError = await this.createApiError(response);
      const error = new Error(apiError.message || 'Failed to fetch binary data') as ApiClientError;
      error.status = apiError.status;
      error.details = apiError.details;
      error.apiError = apiError;
      throw error;
    }

    return await response.blob();
  }
}

/**
 * Singleton instance of ApiClient
 * Use this throughout your application for consistency
 *
 * @example
 * import { apiClient } from '@/services/ApiClient';
 *
 * const teams = await apiClient.get<TeamListResponse>('/teams/all');
 */
export const apiClient = new ApiClient();
