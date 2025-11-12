import { GitHubPRQueryParams, GitHubPullRequestsResponse } from '@/types/developer-portal';
import { apiClient } from './ApiClient';
import { GitHubContributionsResponse, GitHubAveragePRTimeResponse, GitHubHeatmapResponse } from '@/types/api';


export async function fetchGitHubPullRequests(
  params?: GitHubPRQueryParams
): Promise<GitHubPullRequestsResponse> {
  return apiClient.get<GitHubPullRequestsResponse>('/github/pull-requests', {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

export async function fetchGitHubContributions(): Promise<GitHubContributionsResponse> {
  return apiClient.get<GitHubContributionsResponse>('/github/contributions');
}

export async function fetchGitHubAveragePRTime(): Promise<GitHubAveragePRTimeResponse> {
  return apiClient.get<GitHubAveragePRTimeResponse>('/github/average-pr-time');
}

export async function fetchGitHubHeatmap(): Promise<GitHubHeatmapResponse> {
  return apiClient.get<GitHubHeatmapResponse>('/github/githubtools/heatmap');
}