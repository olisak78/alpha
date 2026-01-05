import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchGitHubPRReviewComments } from '@/services/githubApi';
import type { GitHubPRReviewCommentsResponse } from '@/types/api';

export function useGitHubPRReviewComments(
  period?: string,
  options?: Omit<
    UseQueryOptions<GitHubPRReviewCommentsResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<GitHubPRReviewCommentsResponse, Error> {
  return useQuery({
    queryKey: queryKeys.github.prReviewComments(period),
    queryFn: () => fetchGitHubPRReviewComments(period),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  });
}
