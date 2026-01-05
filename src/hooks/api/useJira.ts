import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import { queryKeys } from '@/lib/queryKeys';
import type {
  JiraIssuesResponse,
  JiraIssuesCountResponse,
  JiraIssuesParams,
  MyJiraIssuesParams,
  MyJiraIssuesCountParams,
} from '@/types/api';
import { fetchJiraIssues, fetchMyJiraIssues, fetchMyJiraIssuesCount } from '@/services/JiraApi';

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook to fetch Jira issues for teams/projects
 */
export function useJiraIssues(
  params: JiraIssuesParams = {},
  options?: Omit<
    UseQueryOptions<JiraIssuesResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<JiraIssuesResponse, Error> {
  return useQuery({
    queryKey: queryKeys.jira.issues.list(params),
    queryFn: () => fetchJiraIssues(params),
    ...options,
  });
}

/**
 * Hook to fetch my Jira issues
 */
export function useMyJiraIssues(
  params: MyJiraIssuesParams = {},
  options?: Omit<
    UseQueryOptions<JiraIssuesResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<JiraIssuesResponse, Error> {
  return useQuery({
    queryKey: queryKeys.jira.myIssues.list(params),
    queryFn: () => fetchMyJiraIssues(params),
    ...options,
  });
}

/**
 * Hook to fetch count of my Jira issues by status
 */
export function useMyJiraIssuesCount(
  params: MyJiraIssuesCountParams,
  options?: Omit<
    UseQueryOptions<JiraIssuesCountResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<JiraIssuesCountResponse, Error> {
  return useQuery({
    queryKey: queryKeys.jira.myIssues.count(params),
    queryFn: () => fetchMyJiraIssuesCount(params),
    enabled: !!params.status, // Only run if status is provided
    ...options,
  });
}
