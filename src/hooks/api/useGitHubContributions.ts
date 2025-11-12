// Create new file: src/hooks/api/useGitHubContributions.ts

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchGitHubContributions } from '@/services/githubApi';
import type { GitHubContributionsResponse } from '@/types/api';

export function useGitHubContributions(
  options?: Omit<
    UseQueryOptions<GitHubContributionsResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<GitHubContributionsResponse, Error> {
  return useQuery({
    queryKey: queryKeys.github.contributions(),
    queryFn: fetchGitHubContributions,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  });
}