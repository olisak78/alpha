import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchLandscapesByProject } from '@/services/LandscapesApi';
import type { Landscape } from '@/types/developer-portal';


export function useLandscapesByProject(
  projectName: string,
  options?: Omit<
    UseQueryOptions<Landscape[], Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<Landscape[], Error> {
  return useQuery({
    queryKey: queryKeys.landscapes.byProject(projectName),
    queryFn: () => fetchLandscapesByProject(projectName),
    enabled: !!projectName && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  });
}