import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import type { Component } from '@/types/api';
import { fetchSwaggerSchema, LandscapeConfig, SwaggerApiResponse } from '@/services/SwaggerApi';

/**
 * Response type for Swagger UI
 */
export interface SwaggerUIResponse {
  schema: SwaggerApiResponse;
  swaggerUiUrl?: string;
}

/**
 * Hook to fetch Swagger API schema for a component
 * Returns the schema data and the URL to open Swagger UI in a new tab
 * Uses react-query for caching and state management
 * 
 * @param component - The component to get Swagger data for
 * @param landscape - The landscape configuration
 * @param options - Additional options (enabled, etc.)
 * @returns Swagger schema and UI URL with loading/error states
 * 
 * @example
 * const { data, isLoading, error } = useSwaggerUI(component, landscape);
 * if (data?.schema) {
 *   // Display schema in UI
 *   // Open Swagger UI: window.open(data.swaggerUiUrl, '_blank')
 * }
 */
export function useSwaggerUI(
  component: Component | null | undefined,
  landscape: LandscapeConfig | null | undefined,
  options?: { enabled?: boolean }
) {
  const enabled = options?.enabled ?? true;

  return useQuery({
    queryKey: queryKeys.swagger.byComponent(
      component?.name || '',
      landscape?.name || ''
    ),
    queryFn: async () => {
      if (!component || !landscape) {
        throw new Error('Component and landscape are required');
      }

      const result = await fetchSwaggerSchema(component, landscape);

      if (result.status === 'error') {
        throw new Error(result.error || 'Failed to fetch Swagger schema');
      }

      if (!result.data) {
        throw new Error('No schema data returned');
      }

      return {
        schema: result.data,
        swaggerUiUrl: result.swaggerUiUrl,
      };
    },
    enabled: enabled && !!component && !!landscape,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}