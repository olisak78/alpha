/**
 * Plugin API Client
 * 
 * Provides a scoped API client for plugins that automatically
 * routes requests through the portal's proxy endpoint.
 * 
 * Production mode: /plugins/:pluginId/proxy?path=<endpoint>
 * Local dev mode: Direct requests to custom backend URL
 * 
 * This ensures plugins can only access their designated endpoints
 * and inherits authentication from the main portal API client.
 */

import { apiClient } from '@/services/ApiClient';
import type { PluginApiClient as IPluginApiClient, RequestOptions } from '../types/plugin-types';

/**
 * Implementation of the PluginApiClient interface
 * 
 * All API calls are automatically routed through the portal's proxy endpoint
 * at /plugins/:pluginId/proxy?path=<endpoint> and inherit authentication
 * from the portal's main API client.
 * 
 * In local development mode, if a plugin backend proxy URL is set
 * in sessionStorage, requests will be sent directly to that URL
 * instead of the portal backend.
 */
export class PluginApiClient implements IPluginApiClient {
  private readonly pluginId: string;
  private readonly basePath: string;

  constructor(pluginId: string) {
    if (!pluginId || pluginId.trim() === '') {
      throw new Error('Plugin ID is required for PluginApiClient');
    }
    
    this.pluginId = pluginId;
    this.basePath = `/plugins/${pluginId}`;
  }

  /**
   * Get the effective backend URL for API requests
   * 
   * Checks sessionStorage for a plugin backend proxy URL.
   * If found, uses that for local testing. Otherwise, uses
   * the portal's normal backend.
   * 
   * @returns Base URL for API requests
   */
  private getBackendUrl(): string | null {
    try {
      return sessionStorage.getItem('plugin-backend-proxy');
    } catch (error) {
      console.warn('[PluginApiClient] Failed to read sessionStorage:', error);
      return null;
    }
  }

  /**
   * Build the proxy URL for portal backend requests
   * 
   * Constructs the URL in the format: /plugins/:pluginId/proxy?path=<endpoint>
   * 
   * @param path - The API path (e.g., '/data' or '/favorites')
   * @returns Full proxy URL for the request
   */
  private buildProxyUrl(path: string): string {
    // Normalize the path - remove leading slash for the query parameter
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.basePath}/proxy?path=${encodeURIComponent(normalizedPath)}`;
  }

  /**
   * Make a request with backend proxy support
   * 
   * If a backend proxy URL is configured, makes a direct fetch call.
   * Otherwise, uses the portal's authenticated API client with proxy endpoint.
   * 
   * @param path - API path
   * @param method - HTTP method
   * @param body - Request body (optional)
   * @param options - Request options
   * @returns Response data
   */
  private async request<T>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    body?: any,
    options?: RequestOptions
  ): Promise<T> {
    const backendProxy = this.getBackendUrl();

    if (backendProxy) {
      // Direct proxy mode - bypass portal backend
      return this.directRequest<T>(path, method, body, options);
    }

    // Normal mode - use portal's API client with proxy endpoint
    return this.portalRequest<T>(path, method, body, options);
  }

  /**
   * Make a direct request to the plugin's backend (local testing mode)
   * 
   * Automatically includes the portal's authentication token in the request.
   * 
   * @param path - API path
   * @param method - HTTP method
   * @param body - Request body
   * @param options - Request options
   * @returns Response data
   */
  private async directRequest<T>(
    path: string,
    method: string,
    body?: any,
    options?: RequestOptions
  ): Promise<T> {
    const backendProxy = this.getBackendUrl();
    if (!backendProxy) {
      throw new Error('Backend proxy URL not configured');
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const url = `${backendProxy}${normalizedPath}`;

    // Build query string if params exist
    const urlWithParams = new URL(url);
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          urlWithParams.searchParams.append(key, String(value));
        }
      });
    }
    // Get the access token from the main API client
    let authToken: string | null = null;
    try {
      authToken = await apiClient.getToken();
    } catch (error) {
      console.warn('[PluginApiClient] Failed to get auth token:', error);
      // Continue without token - the backend will handle auth error
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add Authorization header if we have a token
        ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
        ...options?.headers,
      },
      credentials: 'include', // Include cookies for CORS
      signal: options?.signal,
    };

    // Add body for non-GET requests
    if (body !== undefined && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(urlWithParams.toString(), fetchOptions);

      if (!response.ok) {
        let errorMessage = `Request failed: ${response.status} ${response.statusText}`;
        try {
          const errorBody = await response.json();
          errorMessage = errorBody.message || errorBody.error || errorMessage;
        } catch {
          // Error body not JSON
        }
        throw new Error(errorMessage);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T;
      }

      return await response.json();
    } catch (error) {
      console.error('[PluginApiClient] Direct request failed:', error);
      throw error;
    }
  }

  /**
   * Make a request through the portal's proxy endpoint (production mode)
   * 
   * Routes requests through /plugins/:pluginId/proxy?path=<endpoint>
   * The proxy wraps responses in { data, pluginSuccess, statusCode, responseTime }
   * This method automatically unwraps the response to return just the data.
   * 
   * @param path - API path
   * @param method - HTTP method
   * @param body - Request body
   * @param options - Request options
   * @returns Response data (unwrapped from proxy envelope)
   */
  private async portalRequest<T>(
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    body?: any,
    options?: RequestOptions
  ): Promise<T> {
    const proxyUrl = this.buildProxyUrl(path);
    
    // Merge the path query param with any additional params
    const mergedParams = { ...options?.params };

    let response: any;

    switch (method) {
      case 'GET':
        response = await apiClient.get(proxyUrl, {
          params: mergedParams,
          headers: options?.headers,
          signal: options?.signal,
        });
        break;
      case 'POST':
        response = await apiClient.post(proxyUrl, body, {
          headers: options?.headers,
          signal: options?.signal,
        });
        break;
      case 'PUT':
        response = await apiClient.put(proxyUrl, body, {
          headers: options?.headers,
          signal: options?.signal,
        });
        break;
      case 'DELETE':
        response = await apiClient.delete(proxyUrl, {
          headers: options?.headers,
          signal: options?.signal,
        });
        break;
      case 'PATCH':
        response = await apiClient.patch(proxyUrl, body, {
          headers: options?.headers,
          signal: options?.signal,
        });
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    // Unwrap proxy response envelope if present
    // The proxy wraps responses in { data, pluginSuccess, statusCode, responseTime }
    if (response && typeof response === 'object' && 'pluginSuccess' in response && 'data' in response) {
      if (!response.pluginSuccess) {
        throw new Error(response.error || 'Plugin request failed');
      }
      return response.data as T;
    }

    return response as T;
  }

  async get<T = any>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, 'GET', undefined, options);
  }

  async post<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, 'POST', body, options);
  }

  async put<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, 'PUT', body, options);
  }

  async delete<T = any>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, 'DELETE', undefined, options);
  }

  async patch<T = any>(path: string, body?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>(path, 'PATCH', body, options);
  }

  getPluginId(): string {
    return this.pluginId;
  }

  getBasePath(): string {
    return this.basePath;
  }

  /**
   * Check if backend proxy mode is active
   * 
   * @returns true if requests are being proxied to a custom backend
   */
  isProxyMode(): boolean {
    return this.getBackendUrl() !== null;
  }

  /**
   * Get the current backend proxy URL (if set)
   * 
   * @returns Backend proxy URL or null
   */
  getProxyUrl(): string | null {
    return this.getBackendUrl();
  }
}