/**
 * Swagger API Service
 * Utilities for fetching Swagger UI HTML content from component endpoints
 */

import { apiClient } from './ApiClient';

/**
 * Extract the base URL from a health endpoint URL
 * Example: /api/v1/cis-public/proxy?url=https%3A%2F%2Faccount-budgets-service.cfapps.stagingaws.hanavlab.ondemand.com%2Fhealth
 * Returns: https://account-budgets-service.cfapps.stagingaws.hanavlab.ondemand.com
 */
export function extractBaseUrlFromHealthEndpoint(healthEndpoint: string): string | null {
  try {
    // Extract the URL parameter from the proxy endpoint
    const urlMatch = healthEndpoint.match(/[?&]url=([^&]+)/);
    if (!urlMatch) return null;

    const encodedUrl = urlMatch[1];
    const decodedUrl = decodeURIComponent(encodedUrl);

    // Remove the /health part to get the base URL
    const baseUrl = decodedUrl.replace(/\/health$/, '');

    return baseUrl;
  } catch (error) {
    console.error('Error extracting base URL from health endpoint:', error);
    return null;
  }
}

/**
 * Build Swagger UI URL from base URL
 * Example: https://account-budgets-service.cfapps.stagingaws.hanavlab.ondemand.com
 * Returns: https://account-budgets-service.cfapps.stagingaws.hanavlab.ondemand.com/swagger-ui.html
 */
export function buildSwaggerUrl(baseUrl: string): string {
  return `${baseUrl}/swagger-ui.html`;
}

/**
 * Fetch Swagger UI HTML content via backend proxy
 * Uses backend proxy to avoid CORS issues
 */
export async function fetchSwaggerHtml(
  swaggerUrl: string,
  signal?: AbortSignal
): Promise<{
  status: 'success' | 'error';
  html?: string;
  error?: string;
}> {
  try {
    // Use backend proxy endpoint via apiClient (handles auth automatically)
    const data = await apiClient.get<{ html?: string; componentSuccess?: boolean; statusCode?: number }>(
      '/cis-public/proxy',
      {
        params: { url: swaggerUrl },
        signal,
      }
    );

    // Check if the component endpoint returned success (200-299)
    if (data.componentSuccess === false) {
      return {
        status: 'error',
        error: `Component returned status ${data.statusCode}`,
      };
    }

    // If the response has HTML content, return it
    if (data.html) {
      return {
        status: 'success',
        html: data.html,
      };
    }

    // If the response itself is a string (HTML), use it directly
    if (typeof data === 'string') {
      return {
        status: 'success',
        html: data,
      };
    }

    return {
      status: 'error',
      error: 'No HTML content in response',
    };
  } catch (error) {
    // Don't treat AbortError as a real error
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 'error',
        error: 'Request aborted',
      };
    }

    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}