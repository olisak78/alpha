// src/hooks/api/useGitHubHeatmap.ts

import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchGitHubHeatmap } from '@/services/githubApi';
import type { GitHubHeatmapResponse } from '@/types/api';

export function useGitHubHeatmap(
  options?: Omit<
    UseQueryOptions<GitHubHeatmapResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<GitHubHeatmapResponse, Error> {
  return useQuery({
    queryKey: queryKeys.github.heatmap(),
    queryFn: fetchGitHubHeatmap,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  });
}