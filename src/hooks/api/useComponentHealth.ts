/**
 * React Query hook for fetching component health status
 * Fetches health data from /api/v1/components/health endpoint
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { fetchComponentHealth } from '@/services/healthApi';  // NEW: Import the API function
import type { HealthResponse } from '@/types/health';

interface ComponentHealthResult {  // NEW: Define result type
    status: 'success' | 'error';
    data?: HealthResponse;
    error?: string;
    responseTime?: number;
}

/**
 * Hook to fetch health status for a specific component and landscape
 * Only fetches when component has health enabled and landscape is selected
 * 
 * @param componentId - UUID of the component
 * @param landscapeId - UUID of the selected landscape
 * @param hasHealth - Boolean indicating if component has health endpoint enabled
 * @param options - Additional React Query options
 */
export function useComponentHealth(  // NEW: Create hook for component health
    componentId: string | undefined,
    landscapeId: string | null,
    hasHealth: boolean = false,  // NEW: Only fetch if component has health enabled
    options?: Omit<
        UseQueryOptions<ComponentHealthResult, Error>,
        'queryKey' | 'queryFn'
    >
) {
    return useQuery<ComponentHealthResult, Error>({
        queryKey: ['component-health', componentId, landscapeId],  // NEW: Cache key includes both IDs
        queryFn: async ({ signal }) => {
            if (!componentId || !landscapeId) {
                throw new Error('Component ID and Landscape ID are required');
            }
            return fetchComponentHealth(componentId, landscapeId, signal);  // NEW: Call API function
        },
        // Only enable query when component has health enabled and landscape is selected
        enabled: hasHealth && !!componentId && !!landscapeId && (options?.enabled ?? true),  // NEW: Conditional fetching
        // Don't cache health data - always fetch fresh
        staleTime: 0,  // NEW: No caching for fresh data
        gcTime: 0,     // NEW: No garbage collection time
        // Retry once on failure
        retry: 1,
        ...options,
    });
}