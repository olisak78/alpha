/**
 * Plugin API Client
 * 
 * Provides a convenient interface for plugins to communicate with backend APIs.
 * All requests are scoped to /api/plugins/:pluginId/*
 */


export class PluginApiClient implements IPluginApiClient {
  private baseUrl: string;

  constructor(private pluginId: string) {
    // Construct base URL for this plugin's API routes
    this.baseUrl = `/api/plugins/${pluginId}`;
  }

  /**
   * Make a fetch request with common error handling
   */
  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/${path.replace(/^\//, '')}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage: string;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || response.statusText;
        } catch {
          errorMessage = errorText || response.statusText;
        }

        throw new Error(
          `Plugin API request failed: ${response.status} ${errorMessage}`
        );
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return null as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[PluginApiClient] ${this.pluginId} - ${error.message}`);
        throw error;
      }
      throw new Error('Unknown error occurred during plugin API request');
    }
  }

  /**
   * GET request
   */
  async get<T = any>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'GET',
    });
  }

  /**
   * POST request
   */
  async post<T = any>(
    path: string,
    body?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T = any>(
    path: string,
    body?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T = any>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'DELETE',
    });
  }

  /**
   * Get the plugin ID this client is configured for
   */
  getPluginId(): string {
    return this.pluginId;
  }

  /**
   * Get the base URL for this plugin's API routes
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }
}