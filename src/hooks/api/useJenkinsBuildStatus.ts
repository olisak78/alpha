import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { fetchJenkinsBuildStatus, type JenkinsBuildStatusResponse } from '@/services/SelfServiceApi';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook to poll Jenkins build status
 * 
 * This hook automatically polls the Jenkins build status endpoint
 * until the build reaches a terminal state (success/failed).
 * 
 * @param jaasName - Jenkins JAAS name
 * @param jobName - Jenkins job name
 * @param buildNumber - Build number
 * @param options - React Query options
 * 
 * @example
 * const { data: status, isLoading } = useJenkinsBuildStatus(
 *   'gkecfsmulticis2',
 *   'multi-cis-v3-create',
 *   123,
 *   { enabled: !!buildNumber }
 * );
 */
export function useJenkinsBuildStatus(
  jaasName: string | undefined,
  jobName: string | undefined,
  buildNumber: number | undefined,
  options?: Omit<UseQueryOptions<JenkinsBuildStatusResponse, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: queryKeys.selfService.buildStatus(jaasName || '', jobName || '', buildNumber || 0),
    queryFn: async () => {
      if (!jaasName || !jobName || !buildNumber) {
        throw new Error('jaasName, jobName, and buildNumber are required');
      }
      try {
        const response = await fetchJenkinsBuildStatus(jaasName, jobName, buildNumber);
        return response;
      } catch (error) {
        console.error(`[Build Status] ❌ Error fetching build status:`, error);
        throw error;
      }
    },
    enabled: !!jaasName && !!jobName && !!buildNumber && buildNumber > 0 && (options?.enabled ?? true),
    // Poll every 1 second
    refetchInterval: (query) => {
      // Stop polling if build reached terminal state
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