import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchJenkinsJobHistory, type JenkinsJobHistoryResponse } from '@/services/SelfServiceApi';

/**
 * Hook to fetch Jenkins job history with pagination and time filtering
 * 
 * @param limit - Number of jobs per page (default: 10)
 * @param offset - Offset for pagination
 * @param onlyMine - If true, fetch only current user's jobs (default: true)
 * @param lastUpdated - Number of hours to look back for job updates (default: 48)
 * 
 * @example
 * const { data, isLoading, refetch } = useJenkinsJobHistory(10, 0, true, 24);
 */
export function useJenkinsJobHistory(
  limit: number = 10,
  offset: number = 0,
  onlyMine: boolean = true,
  lastUpdated: number = 48
): UseQueryResult<JenkinsJobHistoryResponse, Error> {
  return useQuery({
    queryKey: queryKeys.selfService.jobHistory(limit, offset, onlyMine, lastUpdated),
    queryFn: () => fetchJenkinsJobHistory(limit, offset, onlyMine, lastUpdated),
    // Don't cache - always get fresh data
    staleTime: 0,
    gcTime: 0,
    // Don't refetch on window focus since user has refresh button
    refetchOnWindowFocus: false,
    retry: 1,
  });
}