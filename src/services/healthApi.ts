/**
 * Health API Service
 * Utilities for fetching component health statuses using the new backend endpoint
 */

import { apiClient } from './ApiClient';
import type { Component, HealthResponse, LandscapeConfig } from '@/types/health';

export interface SystemInformation {
  // Standard /systemInformation/public response structure
  gitProperties?: {
    'git.commit.id'?: string;
    'git.build.time'?: string;
    'git.commit.time'?: string;
  };
  buildProperties?: {
    group?: string;
    artifact?: string;
    time?: number;
    version?: string | { app?: string; sapui5?: string };
    name?: string;
  };
  // Direct /version response structure (may be at root level)
  app?: string;
  sapui5?: string;
}

/**
 * Build system information endpoint URL
 * Default endpoint: /systemInformation/public
 */
export function buildSystemInfoEndpoint(
  component: Component,
  landscape: LandscapeConfig,
  endpoint: string = '/systemInformation/public'
): string {
  const componentName = component.name.toLowerCase();
  const domain = landscape.route;
  const url = `https://${componentName}.cfapps.${domain}${endpoint}`;
  return url;
}

/**
 * Build system information endpoint URL with subdomain prefix
 */
export function buildSystemInfoEndpointWithSubdomain(
  component: Component,
  landscape: LandscapeConfig,
  subdomain: string,
  endpoint: string = '/systemInformation/public'
): string {
  const componentName = component.name.toLowerCase();
  const domain = landscape.route;
  const url = `https://${subdomain}.${componentName}.cfapps.${domain}${endpoint}`;
  return url;
}

/**
 * Fetch health status for a specific component and landscape using new endpoint
 * Endpoint: /api/v1/components/health?component-id=<component id>&landscape-id=<landscape id>
 * 
 * @param componentId - UUID of the component
 * @param landscapeId - UUID of the landscape
 * @param signal - Optional AbortSignal for cancelling the request
 * @returns Promise with health status result
 */
export async function fetchComponentHealth(  // NEW: Add this function to healthApi.ts
  componentId: string,
  landscapeId: string,
  signal?: AbortSignal
): Promise<{
  status: 'success' | 'error';
  data?: HealthResponse;
  error?: string;
  responseTime?: number;
}> {
  const startTime = Date.now();

  try {
    const rawData = await apiClient.get<any>('/components/health', {   
      params: {
        'component-id': componentId,   
        'landscape-id': landscapeId    
      },
      signal,
    });

    // Transform the response to ensure details field is parsed as JSON if it's a string
    const data: HealthResponse = {
      ...rawData,
      details: rawData.details && typeof rawData.details === 'string' 
        ? (() => {
            try {
              return JSON.parse(rawData.details);
            } catch (parseError) {
              // Silently handle JSON parsing errors - just return the raw string wrapped in an object
              return { raw: rawData.details };
            }
          })()
        : rawData.details
    };

    const responseTime = Date.now() - startTime;

    return {
      status: 'success',
      data,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to fetch component health',
      responseTime,
    };
  }
}

/**
 * Fetch system information for a component with multiple fallback attempts
 * Tries multiple endpoints in order:
 * 1. /systemInformation/public
 * 2. /systemInformation/public with subdomain (if available)
 * 3. /version
 * 4. /version with subdomain (if available)
 */
export async function fetchSystemInformation(
  component: Component,
  landscape: LandscapeConfig,
  signal?: AbortSignal
): Promise<{
  status: 'success' | 'error';
  data?: SystemInformation;
  error?: string;
  url?: string;
}> {
  const subdomain = component.metadata?.subdomain;

  // Attempt 1: Try /systemInformation/public
  try {
    const sysInfoUrl = buildSystemInfoEndpoint(component, landscape);
    const data = await apiClient.get<SystemInformation & { componentSuccess?: boolean; statusCode?: number }>('/cis-public/proxy', {
      params: { url: sysInfoUrl },
      signal,
    });

    if (data.componentSuccess !== false) {
      return { status: 'success', data, url: sysInfoUrl };
    }
  } catch (error1) {
    // Continue to next attempt
  }

  // Attempt 2: Try /systemInformation/public with subdomain if available
  if (subdomain && typeof subdomain === 'string') {
    try {
      const fallbackUrl = buildSystemInfoEndpointWithSubdomain(component, landscape, subdomain);
      const data = await apiClient.get<SystemInformation & { componentSuccess?: boolean; statusCode?: number }>('/cis-public/proxy', {
        params: { url: fallbackUrl },
        signal,
      });

      if (data.componentSuccess !== false) {
        return { status: 'success', data, url: fallbackUrl };
      }
    } catch (error2) {
      // Continue to next attempt
    }
  }

  // Attempt 3: Try /version endpoint
  try {
    const versionUrl = buildSystemInfoEndpoint(component, landscape, '/version');
    const data = await apiClient.get<SystemInformation & { componentSuccess?: boolean; statusCode?: number }>('/cis-public/proxy', {
      params: { url: versionUrl },
      signal,
    });

    if (data.componentSuccess !== false) {
      return { status: 'success', data, url: versionUrl };
    }
  } catch (error3) {
    // Continue to next attempt
  }

  // Attempt 4: Try /version with subdomain prefix if available
  if (subdomain && typeof subdomain === 'string') {
    try {
      const versionSubdomainUrl = buildSystemInfoEndpointWithSubdomain(component, landscape, subdomain, '/version');
      const data = await apiClient.get<SystemInformation & { componentSuccess?: boolean; statusCode?: number }>('/cis-public/proxy', {
        params: { url: versionSubdomainUrl },
        signal,
      });

      if (data.componentSuccess !== false) {
        return { status: 'success', data, url: versionSubdomainUrl };
      }
    } catch (error4) {
      // All attempts failed
    }
  }

  return {
    status: 'error',
    error: 'All system info endpoints failed',
  };
}
