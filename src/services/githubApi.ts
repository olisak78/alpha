import { ClosePullRequestParams, ClosePullRequestPayload, ClosePullRequestResponse, GitHubPRQueryParams, GitHubPullRequestsResponse } from '@/types/developer-portal';
import { apiClient } from './ApiClient';
import { GitHubContributionsResponse, GitHubAveragePRTimeResponse, GitHubHeatmapResponse, GitHubPRReviewCommentsResponse } from '@/types/api';


export async function fetchGitHubPullRequests(
  params?: GitHubPRQueryParams
): Promise<GitHubPullRequestsResponse> {
  return apiClient.get<GitHubPullRequestsResponse>('/github/githubtools/pull-requests', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export async function fetchGitHubContributions(): Promise<GitHubContributionsResponse> {
  return apiClient.get<GitHubContributionsResponse>('/github/contributions');
}

export async function fetchGitHubAveragePRTime(period?: string): Promise<GitHubAveragePRTimeResponse> {
  return apiClient.get<GitHubAveragePRTimeResponse>('/github/average-pr-time', {
    params: period ? { period } : undefined,
  });
}

export async function fetchGitHubHeatmap(): Promise<GitHubHeatmapResponse> {
  return apiClient.get<GitHubHeatmapResponse>('/github/githubtools/heatmap');
}

export async function fetchGitHubPRReviewComments(period?: string): Promise<GitHubPRReviewCommentsResponse> {
  return apiClient.get<GitHubPRReviewCommentsResponse>('/github/pr-review-comments', {
    params: period ? { period } : undefined,
  });
}

export async function closePullRequest(params: ClosePullRequestParams): Promise<{ message: string }> {
  const { prNumber, ...body } = params;
  return apiClient.patch<{ message: string }>(`/github/githubtools/pull-requests/close/${prNumber}`, body);
}