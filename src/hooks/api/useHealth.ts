/**
 * React Query hook for component health monitoring
 * Integrates health checks into the React Query system with 1-minute cache
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { Component, ComponentHealthCheck, HealthSummary, LandscapeConfig } from '@/types/health';
import { fetchComponentHealth } from '@/services/healthApi';

interface UseHealthOptions {
  components: Component[];
  landscape: LandscapeConfig;
  enabled?: boolean;
  isCentralLandscape?: boolean;
}

interface UseHealthReturn {
  healthChecks: ComponentHealthCheck[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  summary: HealthSummary;
  refetch: () => void;
  isFetching: boolean;
}

/**
 * Calculate summary statistics from health checks
 */
function calculateSummary(healthChecks: ComponentHealthCheck[]): HealthSummary {
  const responseTimes = healthChecks
    .filter(h => h.responseTime !== undefined)
    .map(h => h.responseTime!);

  const avgResponseTime = responseTimes.length > 0
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
    : 0;

  return {
    total: healthChecks.length,
    up: healthChecks.filter(h => h.response?.healthy === true).length,
    down: healthChecks.filter(h => !h.response?.healthy).length,
    unknown: healthChecks.filter(h => h.response?.details?.status === 'UNKNOWN' || h.response?.details?.status === 'OUT_OF_SERVICE').length,
    error: healthChecks.filter(h => h.status === 'ERROR').length,
    avgResponseTime: Math.round(avgResponseTime),
  };
}

/**
 * Hook to fetch health statuses for all components in a landscape
 * Uses React Query with 1-minute cache based on staleTime
 */
export function useHealth({
  components,
  landscape,
  enabled = true,
  isCentralLandscape = false
}: UseHealthOptions): UseHealthReturn {

  const componentsToCheck = components.filter(c => {
    // Only check components with health: true
    if (c.health !== true) return false;
    
    // If component is marked as central-service, only check it in central landscape
    if (c['central-service'] === true && !isCentralLandscape) {
      return false;
    }
    
    return true;
  });

  const queryResult = useQuery<ComponentHealthCheck[], Error>({
    queryKey: ['health', landscape.id, landscape.name, landscape.route, componentsToCheck.length],
    queryFn: async ({ signal }) => {
      // Fetch health for each component using the new endpoint
      const healthChecks: ComponentHealthCheck[] = [];
      
      const promises = componentsToCheck.map(async (component) => {
        const healthCheck: ComponentHealthCheck = {
          componentId: component.id,
          componentName: component.name,
          landscape: landscape.name,
          healthUrl: '', // Not applicable for new endpoint
          status: 'LOADING',
        };
        if(!component.health) return null;
        try {
          const result = await fetchComponentHealth(component.id, landscape.id, signal);

          if (result.status === 'success' && result.data) {
            healthCheck.status = result.data.status;
            healthCheck.response = result.data;
            healthCheck.responseTime = result.responseTime;
            healthCheck.lastChecked = new Date();
          } else {
            healthCheck.status = 'ERROR';
            healthCheck.error = result.error;
            healthCheck.responseTime = result.responseTime;
            healthCheck.lastChecked = new Date();
          }
        } catch (error) {
          healthCheck.status = 'ERROR';
          healthCheck.error = error instanceof Error ? error.message : 'Unknown error';
          healthCheck.lastChecked = new Date();
        }

        return healthCheck;
      });

      const results = await Promise.allSettled(promises);
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          healthChecks.push(result.value);
        }
      });

      return healthChecks;
    },
    enabled: enabled && componentsToCheck.length > 0,
    staleTime: 60 * 1000, // Consider data stale after 1 minute
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1,
    refetchOnWindowFocus: false, // Don't refetch on window focus to respect cache
    refetchOnMount: false, // Don't refetch on mount if data is fresh
  });

  const healthChecks = queryResult.data || [];
  const summary = calculateSummary(healthChecks);

  return {
    healthChecks,
    isLoading: queryResult.isLoading,
    isError: queryResult.isError,
    error: queryResult.error,
    summary,
    refetch: queryResult.refetch,
    isFetching: queryResult.isFetching,
  };
}

/**
 * Hook to fetch health status for a single component
 * Useful for component detail pages
 */
export function useComponentHealth(
  component: Component | null,
  landscape: LandscapeConfig | null,
  options?: Omit<UseQueryOptions<ComponentHealthCheck, Error>, 'queryKey' | 'queryFn'>
) {

  return useQuery<ComponentHealthCheck, Error>({
    queryKey: component && landscape
      ? ['health', 'component', component.id, landscape.id, landscape.name]
      : ['health', 'component', 'disabled'],
    queryFn: async ({ signal }) => {
      if (!component || !landscape) {
        throw new Error('Component and landscape are required');
      }

      const healthCheck: ComponentHealthCheck = {
        componentId: component.id,
        componentName: component.name,
        landscape: landscape.name,
        healthUrl: '', // Not applicable for new endpoint
        status: 'LOADING',
      };

      try {
        const result = await fetchComponentHealth(component.id, landscape.id, signal);

        if (result.status === 'success' && result.data) {
          healthCheck.status = result.data.details?.status || result.data.status;
          healthCheck.response = result.data;
          healthCheck.responseTime = result.responseTime;
          healthCheck.lastChecked = new Date();
        } else {
          healthCheck.status = 'ERROR';
          healthCheck.error = result.error;
          healthCheck.responseTime = result.responseTime;
          healthCheck.lastChecked = new Date();
        }
      } catch (error) {
        healthCheck.status = 'ERROR';
        healthCheck.error = error instanceof Error ? error.message : 'Unknown error';
        healthCheck.lastChecked = new Date();
      }

      return healthCheck;
    },
    enabled: !!component && !!landscape,
    staleTime: 60 * 1000, // 1 minute cache
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    ...options,
  });
}
