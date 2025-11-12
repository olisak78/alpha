/**
 * Health API Service
 * Utilities for fetching component health statuses
 */

import { apiClient } from './ApiClient';
import type { Component, HealthResponse, ComponentHealthCheck, LandscapeConfig } from '@/types/health';

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
 * Build health endpoint URL from component and landscape data
 * Example: accounts-service in eu10-canary with domain "sap.hana.ondemand.com"
 * URL: https://accounts-service.cfapps.sap.hana.ondemand.com/health
 */
export function buildHealthEndpoint(
  component: Component,
  landscape: LandscapeConfig
): string {
  const componentName = component.name.toLowerCase();
  const domain = landscape.route;
  const url = `https://${componentName}.cfapps.${domain}/health`;


  return url;
}

/**
 * Build fallback health endpoint URL with subdomain prefix
 * Example: subscription-management-dashboard with subdomain "sap-provisioning"
 * URL: https://sap-provisioning.subscription-management-dashboard.cfapps.sap.hana.ondemand.com/health
 */
export function buildHealthEndpointWithSubdomain(
  component: Component,
  landscape: LandscapeConfig,
  subdomain: string
): string {
  const componentName = component.name.toLowerCase();
  const domain = landscape.route;
  const url = `https://${subdomain}.${componentName}.cfapps.${domain}/health`;


  return url;
}

/**
 * Build system information endpoint URL from component and landscape data
 * Example: accounts-service in eu10-canary
 * URL: https://accounts-service.cfapps.sap.hana.ondemand.com/systemInformation/public
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
 * Build fallback system information endpoint URL with subdomain prefix
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
 * Fetch health status from a single endpoint via backend proxy
 * Uses backend proxy to avoid CORS issues
 */
export async function fetchHealthStatus(
  url: string,
  signal?: AbortSignal
): Promise<{
  status: 'success' | 'error';
  data?: HealthResponse;
  error?: string;
  responseTime: number;
}> {
  const startTime = performance.now();

  try {
    // Use backend proxy endpoint via apiClient (handles auth automatically)
    const data = await apiClient.get<HealthResponse & { componentSuccess?: boolean; statusCode?: number }>('/cis-public/proxy', {
      params: { url },
      signal,
    });

    const responseTime = performance.now() - startTime;

    // Check if the component endpoint returned success (200-299)
    if (data.componentSuccess === false) {
      return {
        status: 'error',
        error: `Component returned status ${data.statusCode}`,
        responseTime,
      };
    }

    return {
      status: 'success',
      data,
      responseTime,
    };
  } catch (error) {
    const responseTime = performance.now() - startTime;

    // Don't treat AbortError as a real error
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        status: 'error',
        error: 'Request aborted',
        responseTime,
      };
    }

    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    };
  }
}

/**
 * Fetch system information from component with multiple fallbacks
 * Tries in order:
 * 1. /systemInformation/public
 * 2. {subdomain}.{component}/systemInformation/public (if subdomain available)
 * 3. /version
 * 4. {subdomain}.{component}/version (if subdomain available)
 */
export async function fetchSystemInfo(
  component: Component,
  landscape: LandscapeConfig,
  signal?: AbortSignal
): Promise<{
  status: 'success' | 'error';
  data?: SystemInformation;
  url?: string;
  error?: string;
}> {
  const subdomain = component.metadata?.subdomain;

  // Attempt 1: Try /systemInformation/public
  try {
    const primaryUrl = buildSystemInfoEndpoint(component, landscape, '/systemInformation/public');
    const data = await apiClient.get<SystemInformation & { componentSuccess?: boolean; statusCode?: number }>('/cis-public/proxy', {
      params: { url: primaryUrl },
      signal,
    });

    // Check if the component endpoint returned success (200-299)
    if (data.componentSuccess !== false) {
      return { status: 'success', data, url: primaryUrl };
    }

  } catch (error1) {

  }

  // Attempt 2: Try with subdomain prefix if available
  if (subdomain && typeof subdomain === 'string') {
    try {
      const fallbackUrl = buildSystemInfoEndpointWithSubdomain(component, landscape, subdomain, '/systemInformation/public');
      const data = await apiClient.get<SystemInformation & { componentSuccess?: boolean; statusCode?: number }>('/cis-public/proxy', {
        params: { url: fallbackUrl },
        signal,
      });

      if (data.componentSuccess !== false) {

        return { status: 'success', data, url: fallbackUrl };
      }

    } catch (error2) {

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

    }
  }

  // All attempts failed

  return {
    status: 'error',
    error: 'All system info endpoints failed',
  };
}

/**
 * Fetch health for all components in parallel
 */
export async function fetchAllHealthStatuses(
  components: Component[],
  landscape: LandscapeConfig,
  signal?: AbortSignal,
  onProgress?: (completed: number, total: number) => void
): Promise<ComponentHealthCheck[]> {
  const healthChecks: ComponentHealthCheck[] = [];

  // Create all health check promises
  const promises = components.map(async (component, index) => {
    const healthUrl = buildHealthEndpoint(component, landscape);

    const healthCheck: ComponentHealthCheck = {
      componentId: component.id,
      componentName: component.name,
      landscape: landscape.name,
      healthUrl,
      status: 'LOADING',
    };

    try {
      // Try primary URL first
      const result = await fetchHealthStatus(healthUrl, signal);

      if (result.status === 'success' && result.data) {
        healthCheck.status = result.data.status;
        healthCheck.response = result.data;
        healthCheck.responseTime = result.responseTime;
        healthCheck.lastChecked = new Date();

        if (onProgress) {
          onProgress(index + 1, components.length);
        }

        return healthCheck;
      }

      // Attempt 2: Try fallback with subdomain if available
      const subdomain = component.metadata?.subdomain;
      if (subdomain && typeof subdomain === 'string') {


        const fallbackUrl = buildHealthEndpointWithSubdomain(component, landscape, subdomain);
        const fallbackResult = await fetchHealthStatus(fallbackUrl, signal);

        if (fallbackResult.status === 'success' && fallbackResult.data) {
          healthCheck.healthUrl = fallbackUrl; // Update to show which URL succeeded
          healthCheck.status = fallbackResult.data.status;
          healthCheck.response = fallbackResult.data;
          healthCheck.responseTime = fallbackResult.responseTime;
          healthCheck.lastChecked = new Date();



          if (onProgress) {
            onProgress(index + 1, components.length);
          }

          return healthCheck;
        }


      }

      // Both primary and fallback /health attempts failed
      healthCheck.status = 'ERROR';
      healthCheck.error = result.error;
      healthCheck.responseTime = result.responseTime;
      healthCheck.lastChecked = new Date();

      if (onProgress) {
        onProgress(index + 1, components.length);
      }

      return healthCheck;
    } catch (error) {
      // Handle any unexpected errors
      healthCheck.status = 'ERROR';
      healthCheck.error = error instanceof Error ? error.message : 'Unknown error';
      healthCheck.lastChecked = new Date();

      if (onProgress) {
        onProgress(index + 1, components.length);
      }

      return healthCheck;
    }
  });

  // Wait for all requests to complete (even if some fail)
  const results = await Promise.allSettled(promises);

  results.forEach((result) => {
    if (result.status === 'fulfilled') {
      healthChecks.push(result.value);
    }
  });

  return healthChecks;
}
