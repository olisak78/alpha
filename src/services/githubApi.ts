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

export async function fetchGitHubWdfPullRequests(
  params?: GitHubPRQueryParams
): Promise<GitHubPullRequestsResponse> {
  return apiClient.get<GitHubPullRequestsResponse>('/github/githubwdf/pull-requests', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export async function fetchBothGitHubPullRequests(
  params?: GitHubPRQueryParams
): Promise<GitHubPullRequestsResponse> {
  // Fetch from both endpoints in parallel
  const [toolsResponse, wdfResponse] = await Promise.all([
    fetchGitHubPullRequests(params),
    fetchGitHubWdfPullRequests(params),
  ]);

  // Combine the pull requests from both sources
  const combinedPRs = [...toolsResponse.pull_requests, ...wdfResponse.pull_requests];
  
  // Sort by updated_at in descending order (most recent first)
  combinedPRs.sort((a, b) => {
    const dateA = new Date(a.updated_at).getTime();
    const dateB = new Date(b.updated_at).getTime();
    return dateB - dateA;
  });

  // Return combined response
  return {
    pull_requests: combinedPRs,
    total: toolsResponse.total + wdfResponse.total,
  };
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