import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import {
  fetchGitHubPullRequests,
} from '@/services/githubApi';
import { GitHubPRQueryParams,GitHubPullRequestsResponse, } from '@/types/developer-portal';


export function useGitHubPRs(
  params?: GitHubPRQueryParams,
  options?: Omit<
    UseQueryOptions<GitHubPullRequestsResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<GitHubPullRequestsResponse, Error> {
  return useQuery({
    // Query key for caching - changes when params change
    queryKey: queryKeys.github.pullRequests(params),
    
    // Function to fetch the data
    queryFn: () => fetchGitHubPullRequests(params),
    
    // Merge custom options with defaults
    ...options,
  });
}