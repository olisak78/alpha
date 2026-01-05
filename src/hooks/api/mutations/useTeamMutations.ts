import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import { queryKeys } from '@/lib/queryKeys';
import type {
  Team,
  CreateTeamRequest,
  UpdateTeamRequest,
} from '@/types/api';

/**
 * Team Link Request
 * Data required to add a link to a team
 */
interface AddTeamLinkRequest {
  name: string;
  description: string;
  owner: string;
  url: string;
  category_id: string;
  tags: string;
}

/**
 * Update Team Links Request
 * Data required to update all links for a team
 */
interface UpdateTeamLinksRequest {
  links: {
    category: string;
    icon: string;
    title: string;
    url: string;
  }[];
}

/**
 * Team Mutation Hooks
 */

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

/**
 * Create a new team
 */
async function createTeam(data: CreateTeamRequest): Promise<Team> {
  return apiClient.post<Team>('/teams', data);
}

/**
 * Update an existing team
 */
async function updateTeam({ id, data }: { id: string; data: UpdateTeamRequest }): Promise<Team> {
  return apiClient.put<Team>(`/teams/${id}`, data);
}

/**
 * Delete a team
 */
async function deleteTeam(id: string): Promise<void> {
  return apiClient.delete(`/teams/${id}`);
}

/**
 * Add a link to a team
 */
async function addTeamLink({ teamId, data }: { teamId: string; data: AddTeamLinkRequest }): Promise<any> {
  return apiClient.post(`/links`, data);
}


/**
 * Update all links for a team
 */
async function updateTeamLinks({ teamId, data }: { teamId: string; data: UpdateTeamLinksRequest }): Promise<any> {
  return apiClient.put(`/teams/${teamId}/links`, data);
}



// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new team
 */
export function useCreateTeam(
  options?: UseMutationOptions<Team, Error, CreateTeamRequest>
) {
  const queryClient = useQueryClient();

   return useMutation({
    mutationFn: createTeam,
    
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.teams.lists() 
      });
      
      // Pass undefined for the 4th argument (MutationMeta context)
      options?.onSuccess?.(data, variables, context, undefined);
    },
    
    ...options,
  });
}

/**
 * Hook to update an existing team
 */
export function useUpdateTeam(
  options?: UseMutationOptions<
    Team,
    Error,
    { id: string; data: UpdateTeamRequest }
  >
) {
  const queryClient = useQueryClient();

   return useMutation({
    mutationFn: updateTeam,
    ...options, // Move this BEFORE onSuccess
    
    onSuccess: async (data, variables, context) => {
      // Invalidate the specific team's detail query
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.teams.detail(variables.id) 
      });
      
      // Invalidate all team lists (because team might appear in multiple lists)
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.teams.lists() 
      });
      
   
    },
  });
}

/**
 * Hook to delete a team
 */
export function useDeleteTeam(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

   return useMutation({
    mutationFn: deleteTeam,
    ...options, // Move this BEFORE onSuccess
    
    onSuccess: async (data, teamId, context) => {
      // Remove the specific team from cache
      queryClient.removeQueries({ 
        queryKey: queryKeys.teams.detail(teamId) 
      });
      
      // Invalidate all team lists
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.teams.lists() 
      });
      
    },
  });
}

/**
 * Hook to add a link to a team
 */
export function useAddTeamLink(
  options?: UseMutationOptions<
    any,
    Error,
    { teamId: string; data: AddTeamLinkRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addTeamLink,
    ...options,
    
    onSuccess: async (data, variables, context) => {
      // Invalidate the specific team's detail query
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.teams.detail(variables.teamId) 
      });
      
      // Invalidate all team lists (because team links might be shown in lists)
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.teams.lists() 
      });
      
      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context, undefined);
      }
    },
  });
}


/**
 * Hook to update all links for a team
 */
export function useUpdateTeamLinks(
  options?: UseMutationOptions<
    any,
    Error,
    { teamId: string; data: UpdateTeamLinksRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTeamLinks,

    onSuccess: async (data, variables, context) => {
      // Invalidate the specific team's detail query
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teams.detail(variables.teamId)
      });

      // Invalidate all team lists (because team links might be shown in lists)
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teams.lists()
      });
    },

    ...options,
  });
}

/**
 * Update team metadata
 */
async function updateTeamMetadata({ id, metadata }: { id: string; metadata: Record<string, any> }): Promise<Team> {
  return apiClient.patch<Team>(`/teams/${id}/metadata`, { metadata });
}

/**
 * Hook to update team metadata (e.g., color)
 */
export function useUpdateTeamMetadata(
  options?: UseMutationOptions<
    Team,
    Error,
    { id: string; metadata: Record<string, any> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTeamMetadata,
    ...options,

    onSuccess: async (data, variables, context) => {
      // Invalidate the specific team's detail query
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teams.detail(variables.id)
      });

      // Invalidate all team lists
      await queryClient.invalidateQueries({
        queryKey: queryKeys.teams.lists()
      });

      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context, undefined);
      }
    },
  });
}
