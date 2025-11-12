import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { fetchJenkinsQueueStatus, type JenkinsQueueStatusResponse } from '@/services/SelfServiceApi';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook to poll Jenkins queue item status
 * 
 * This hook automatically polls the Jenkins queue status endpoint
 * until the job reaches a terminal state (success/failed).
 * 
 * @param jaasName - Jenkins JAAS name
 * @param queueItemId - Queue item ID from trigger response
 * @param options - React Query options
 * 
 * @example
 * const { data: status, isLoading } = useJenkinsQueueStatus(
 *   'atom',
 *   '12345',
 *   { enabled: !!queueItemId }
 * );
 */
export function useJenkinsQueueStatus(
  jaasName: string | undefined,
  queueItemId: string | undefined,
  options?: Omit<UseQueryOptions<JenkinsQueueStatusResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.selfService.queueStatus(jaasName || '', queueItemId || ''),
    queryFn: async () => {
      if (!jaasName || !queueItemId) {
        throw new Error('jaasName and queueItemId are required');
      }
      try {
        const response = await fetchJenkinsQueueStatus(jaasName, queueItemId);
        return response;
      } catch (error) {
        console.error(`[Queue Status] Error fetching queue status:`, error);
        throw error;
      }
    },
    enabled: !!jaasName && !!queueItemId && (options?.enabled ?? true),
    // Poll every 1 second
    refetchInterval: (query) => {
      // Stop polling if job reached terminal state
      // Access the data from query.state.data (React Query v5 API)
      const data = query.state.data;
      if (!data) return 1000;
      
      const status = data.status?.toLowerCase();
      const terminalStates = ['success', 'failed', 'aborted', 'cancelled', 'error'];
      
      if (terminalStates.includes(status)) {
  
        return false; // Stop polling
      }
      
    
      return 1000; // Poll every 1 second
    },
    refetchIntervalInBackground: true,
    staleTime: 0, // Always fetch fresh data
    retry: 3, // Retry failed requests 3 times
    retryDelay: 1000, // Wait 1 second between retries
    ...options,
  });
}