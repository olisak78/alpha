import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { fetchComponentsByOrganization, fetchComponentsByTeamId, fetchComponentsByProject } from '@/services/ComponentsApi';
import type { ComponentListResponse, TeamComponentsListResponse } from '@/types/api';

export function useComponentsByTeam(
  teamId: string,
  organizationId: string,
  options?: Omit<
    UseQueryOptions<TeamComponentsListResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<TeamComponentsListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.components.byTeam(teamId),
    queryFn: async () => {
      const apiResponse = await fetchComponentsByTeamId(teamId);
      const componentsArray = Array.isArray(apiResponse) ? apiResponse : (apiResponse as any).components || [];
      return { components: componentsArray };
    },
    enabled: !!teamId && !!organizationId && (options?.enabled ?? true),
    ...options,
  });
}

/**
 * Hook to fetch all components for an organization
 */
export function useComponentsByOrganization(
  organizationId: string,
  options?: Omit<
    UseQueryOptions<ComponentListResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<ComponentListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.components.byOrganization(organizationId),
    queryFn: () => fetchComponentsByOrganization(organizationId),
    enabled: !!organizationId && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    ...options,
  });
}

/**
 * Hook to fetch components by project name
 */
export function useComponentsByProject(
  projectName: string,
  options?: Omit<
    UseQueryOptions<ComponentListResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<ComponentListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.components.byProject(projectName),
    queryFn: () => fetchComponentsByProject(projectName),
    enabled: !!projectName && (options?.enabled ?? true),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes
    ...options,
  });
}
