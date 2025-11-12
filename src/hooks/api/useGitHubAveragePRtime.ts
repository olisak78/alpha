import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchGitHubAveragePRTime } from '@/services/githubApi';
import type { GitHubAveragePRTimeResponse } from '@/types/api';

export function useGitHubAveragePRTime(
  options?: Omit<
    UseQueryOptions<GitHubAveragePRTimeResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<GitHubAveragePRTimeResponse, Error> {
  return useQuery({
    queryKey: queryKeys.github.averagePRTime(),
    queryFn: fetchGitHubAveragePRTime,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  });
}