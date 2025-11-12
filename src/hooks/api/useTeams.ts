import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import { queryKeys } from '@/lib/queryKeys';
import type {
  Team,
  TeamListResponse,
  TeamQueryParams,
  TeamMember,
} from '@/types/api';
import { Member as ApiMember } from '@/types/api';

/**
 * Teams Query Hooks
 */


// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Fetch all teams with optional filtering using parameters
 */
async function fetchTeams(params?: TeamQueryParams): Promise<TeamListResponse> {
  return apiClient.get<TeamListResponse>('/teams', { 
    params: params as Record<string, string | number | boolean | undefined>
  });
}

/**
 * Fetch a single team by name
 */
async function fetchTeamByName(name: string): Promise<Team> {
  return apiClient.get<Team>(`/teams/${name}`);
}

/**
 * Fetch a single team by ID
 */
async function fetchTeamById(id: string): Promise<Team> {
  return apiClient.get<Team>('/teams', {
    params: { 'team-id': id }
  });
}



// ============================================================================
// REACT HOOKS
// ============================================================================

export function useTeams(
  params?: TeamQueryParams,
  options?: Omit<
    UseQueryOptions<TeamListResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<TeamListResponse, Error> {
  return useQuery({
    // Query key for caching - changes when params change
    queryKey: queryKeys.teams.list(params),
    
    // Function to fetch the data
    queryFn: () => fetchTeams(params),
    
    // Merge custom options with defaults
    ...options,
  });
}

/**
 * Hook to fetch a single team by name
 */
export function useTeam(
  name: string,
  options?: Omit<
    UseQueryOptions<Team, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<Team, Error> {
  return useQuery({
    // Query key includes the specific team name
    queryKey: queryKeys.teams.detail(name),
    
    // Function to fetch the team
    queryFn: () => fetchTeamByName(name),
    
    // Only run the query if we have a name
    enabled: !!name,
    
    // Merge custom options
    ...options,
  });
}

/**
 * Hook to fetch a single team by ID
 */
export function useTeamById(
  teamId: string,
  options?: Omit<
    UseQueryOptions<Team, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<Team, Error> {
  return useQuery({
    // Query key includes the specific team ID
    queryKey: queryKeys.teams.detail(teamId),
    
    // Function to fetch the team using fetchTeamById
    queryFn: () => fetchTeamById(teamId),
    
    // Only run the query if we have a team ID
    enabled: !!teamId,
    staleTime: 0,
    // Force refetch on component mount to avoid stale cache when navigating between teams
    refetchOnMount: 'always',
    
    // Merge custom options
    ...options,
  });
}

/**
 * Hook to prefetch teams data
 */
export function usePrefetchTeams() {
  const { queryClient } = require('@/lib/queryClient');
  
  return (params?: TeamQueryParams) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.teams.list(params),
      queryFn: () => fetchTeams(params),
    });
  };
}

/**
 * Hook to prefetch a specific team
 */
export function usePrefetchTeam() {
  const { queryClient } = require('@/lib/queryClient');
  
  return (name: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.teams.detail(name),
      queryFn: () => fetchTeamByName(name),
    });
  };
}
