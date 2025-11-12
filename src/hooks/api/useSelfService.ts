import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchJenkinsJobParameters } from '@/services/SelfServiceApi';
import type { JenkinsJobParametersResponse } from '@/types/api';

/**
 * Self Service Query Hook
 */

export function useFetchJenkinsJobParameters(
  jaasName: string,
  jobName: string,
  options?: Omit<
    UseQueryOptions<JenkinsJobParametersResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<JenkinsJobParametersResponse, Error> {
  return useQuery({
    queryKey: queryKeys.selfService.jenkinsJobParameters(jaasName, jobName),
    queryFn: () => fetchJenkinsJobParameters(jaasName, jobName),
    // Only run the query if we have both required parameters
    enabled: !!jaasName && !!jobName && (options?.enabled ?? true),
    // Cache for 5 minutes - job parameters don't change frequently
    staleTime: 5 * 60 * 1000,
    // Don't refetch on window focus for job parameters
    refetchOnWindowFocus: false,
    ...options,
  });
}
