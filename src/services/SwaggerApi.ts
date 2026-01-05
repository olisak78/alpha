/**
 * Swagger API Service
 * Utilities for fetching Swagger/OpenAPI documentation for components
 */

import { apiClient } from './ApiClient';
import type { Component } from '@/types/api';

/**
 * Landscape configuration for building URLs
 */
export interface LandscapeConfig {
  name: string;
  route: string;
}

/**
 * Swagger API response structure
 */
export interface SwaggerApiResponse {
  openapi?: string;
  info?: {
    title?: string;
    version?: string;
    description?: string;
  };
  servers?: Array<{
    url: string;
    description?: string;
  }>;
  paths?: Record<string, any>;
  components?: Record<string, any>;
  [key: string]: any;
}

/**
 * Build component Swagger API docs endpoint URL
 * Example: https://accounts-service.cfapps.stagingaws.hanavlab.ondemand.com/v3/api-docs
 */
function buildComponentSwaggerEndpoint(
  component: Component,
  landscape: LandscapeConfig
): string {
  const componentName = component.name.toLowerCase();
  const domain = landscape.route;
  return `https://${componentName}.cfapps.${domain}/v3/api-docs`;
}

/**
 * Build component Swagger API docs endpoint URL with subdomain prefix
 */
function buildComponentSwaggerEndpointWithSubdomain(
  component: Component,
  landscape: LandscapeConfig,
  subdomain: string
): string {
  const componentName = component.name.toLowerCase();
  const domain = landscape.route;
  return `https://${subdomain}.${componentName}.cfapps.${domain}/v3/api-docs`;
}

/**
 * Build the Swagger UI URL for opening in new tab
 * Uses /api endpoint with scope parameter
 */
function buildSwaggerUIUrl(
  component: Component,
  landscape: LandscapeConfig
): string {
  const componentName = component.name.toLowerCase();
  const domain = landscape.route;
  const subdomain = component.metadata?.subdomain;
  
  if (subdomain && typeof subdomain === 'string') {
    return `https://${subdomain}.${componentName}.cfapps.${domain}/api?scope=cis-system`;
  }
  return `https://${componentName}.cfapps.${domain}/api?scope=cis-system`;
}

/**
 * Fetch Swagger API schema through backend proxy
 * Uses apiClient to ensure proper authentication with Authorization header
 * Similar to fetchHealthStatus, routes through backend proxy
 * 
 * @param component - The component
 * @param landscape - The landscape configuration
 * @returns Promise with the Swagger schema JSON
 */
export async function fetchSwaggerSchema(
  component: Component,
  landscape: LandscapeConfig
): Promise<{
  status: 'success' | 'error';
  data?: SwaggerApiResponse;
  error?: string;
  swaggerUiUrl?: string;
}> {
  try {
    const subdomain = component.metadata?.subdomain;
    
    // Build the component's API docs URL
    const componentUrl = subdomain && typeof subdomain === 'string'
      ? buildComponentSwaggerEndpointWithSubdomain(component, landscape, subdomain)
      : buildComponentSwaggerEndpoint(component, landscape);

    // Build the Swagger UI URL for opening in new tab
    const swaggerUiUrl = buildSwaggerUIUrl(component, landscape);

    // Use apiClient to fetch through proxy with proper authorization
    const data = await apiClient.get<SwaggerApiResponse & { componentSuccess?: boolean; statusCode?: number }>('/cis-public/proxy', {
      params: { url: componentUrl },
    });

    // Check if the component endpoint returned success (200-299)
    if (data.componentSuccess === false) {
      return {
        status: 'error',
        error: `Failed to fetch Swagger schema: ${data.statusCode}`,
        swaggerUiUrl,
      };
    }

    return {
      status: 'success',
      data,
      swaggerUiUrl,
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error fetching Swagger schema',
    };
  }
}