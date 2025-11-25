/**
 * React Query hook for component health monitoring
 * Integrates health checks into the React Query system with 1-minute cache
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import type { Component, ComponentHealthCheck, HealthSummary, LandscapeConfig } from '@/types/health';
import { fetchAllHealthStatuses } from '@/services/healthApi';

interface UseHealthOptions {
  components: Component[];
  landscape: LandscapeConfig;
  enabled?: boolean;
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
    up: healthChecks.filter(h => h.status === 'UP').length,
    down: healthChecks.filter(h => h.status === 'DOWN').length,
    unknown: healthChecks.filter(h => h.status === 'UNKNOWN' || h.status === 'OUT_OF_SERVICE').length,
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
  enabled = true 
}: UseHealthOptions): UseHealthReturn {
  
  const queryResult = useQuery<ComponentHealthCheck[], Error>({
    queryKey: ['health', landscape.name, landscape.route, components.length],
    queryFn: async ({ signal }) => {
      const healthChecks = await fetchAllHealthStatuses(
        components,
        landscape,
        signal
      );
      return healthChecks;
    },
    enabled: enabled && components.length > 0,
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
      ? ['health', 'component', component.id, landscape.name]
      : ['health', 'component', 'disabled'],
    queryFn: async ({ signal }) => {
      if (!component || !landscape) {
        throw new Error('Component and landscape are required');
      }
      
      const healthChecks = await fetchAllHealthStatuses(
        [component],
        landscape,
        signal
      );
      
      return healthChecks[0];
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