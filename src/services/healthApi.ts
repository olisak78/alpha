/**
 * Health API Service
 * Utilities for fetching component health statuses
 * Now integrated with React Query system for caching
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
  responseTime?: number;
}> {
  const startTime = Date.now();

  try {
    const data = await apiClient.get<HealthResponse & { componentSuccess?: boolean; statusCode?: number }>('/cis-public/proxy', {
      params: { url },
      signal,
    });

    const responseTime = Date.now() - startTime;

    // Check if the response indicates failure
    if (data.componentSuccess === false) {
      return {
        status: 'error',
        error: `Health check failed with status ${data.statusCode || 'unknown'}`,
        responseTime,
      };
    }

    return {
      status: 'success',
      data,
      responseTime,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      responseTime,
    };
  }
}

/**
 * Fetch system information from multiple fallback endpoints
 * Tries /systemInformation/public, then /version with various combinations
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

/**
 * Fetch health for all components in parallel
 * This function is now used by the React Query hook for caching
 */
export async function fetchAllHealthStatuses(
  components: Component[],
  landscape: LandscapeConfig,
  signal?: AbortSignal
): Promise<ComponentHealthCheck[]> {
  const healthChecks: ComponentHealthCheck[] = [];

  // Create all health check promises
  const promises = components.map(async (component) => {
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
          return healthCheck;
        }
      }

      // Both primary and fallback /health attempts failed
      healthCheck.status = 'ERROR';
      healthCheck.error = result.error;
      healthCheck.responseTime = result.responseTime;
      healthCheck.lastChecked = new Date();
      return healthCheck;
    } catch (error) {
      // Handle any unexpected errors
      healthCheck.status = 'ERROR';
      healthCheck.error = error instanceof Error ? error.message : 'Unknown error';
      healthCheck.lastChecked = new Date();
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