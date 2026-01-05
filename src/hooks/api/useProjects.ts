import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchProjects } from '@/services/ProjectsApi';
import { Project, ProjectResponse } from '@/types/api';


/**
 * Projects Query Hooks
 */

/**
 * Hook to fetch all projects
 */
export function useFetchProjects() {
  return useQuery<Project[], Error>({
    queryKey: queryKeys.projects.list(),   // <-- must return a stable array
    queryFn: fetchProjects,
  });
}
