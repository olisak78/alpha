import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import { queryKeys } from '@/lib/queryKeys';
import type {
  Member,
  User,
  CreateUserRequest,
  UpdateMemberRequest,
} from '@/types/api';

interface UpdateUserRequest {
  email: string;
  first_name: string;
  id: string;
  last_name: string;
  mobile: string;
  team_id: string;
}

interface UpdateUserTeamRequest {
  user_uuid: string;
  new_team_uuid: string;
}

/**
 * Member Mutation Hooks
 * 
 * Provides hooks for creating, updating, and deleting members.
 */

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

async function createUser(data: CreateUserRequest): Promise<User> {
  return apiClient.post<User>('/users', data);
}

async function updateUser(data: UpdateUserRequest): Promise<User> {
  return apiClient.post<User>('/users', data);
}

async function updateUserTeam(data: UpdateUserTeamRequest): Promise<User> {
  return apiClient.put<User>('/users', data);
}


async function updateMember({ id, data }: { id: string, data: Partial<Member> }): Promise<Member> {
  return apiClient.put<Member>(`/members/${id}`, data);
}

async function deleteMember(id: string): Promise<void> {
  return apiClient.delete(`/members/${id}`);
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to create a new user
 */
export function useCreateUser(
  options?: UseMutationOptions<User, Error, CreateUserRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    
    onSuccess: (data, variables, context) => {
      // Invalidate user lists
      queryClient.invalidateQueries({ 
        queryKey: ['users'] 
      });
      
      // Also invalidate team lists if user was assigned to a team
      if (variables.team_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.teams.detail(variables.team_id) 
        });
      }
    },
    
    ...options,
  });
}

/**
 * Hook to create a new member (using user endpoint)
 */
export function useCreateMember(
  options?: UseMutationOptions<User, Error, CreateUserRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    
    onSuccess: (data, variables, context) => {
      // Invalidate user lists
      queryClient.invalidateQueries({ 
        queryKey: ['users'] 
      });
      
      // Also invalidate team lists if user was assigned to a team
      if (variables.team_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.teams.detail(variables.team_id) 
        });
      }
    },
    
    ...options,
  });
}

/**
 * Hook to update an existing user
 */
export function useUpdateUser(
  options?: UseMutationOptions<
    User,
    Error,
    UpdateUserRequest
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    
    onSuccess: (data, variables, context) => {
      // Invalidate the specific user
      queryClient.invalidateQueries({ 
        queryKey: ['users', variables.id] 
      });
      
      // Invalidate user lists
      queryClient.invalidateQueries({ 
        queryKey: ['users'] 
      });
      
      // Invalidate team members if user was assigned to a team
      if (variables.team_id) {
        queryClient.invalidateQueries({ 
          queryKey: queryKeys.teams.detail(variables.team_id) 
        });
      }
      
    },
    
    ...options,
  });
}

/**
 * Hook to update user team
 */
export function useUpdateUserTeam(
  options?: UseMutationOptions<User, Error, UpdateUserTeamRequest>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserTeam,
    
    onSuccess: (data, variables, context) => {
      // Invalidate the specific user
      queryClient.invalidateQueries({ 
        queryKey: ['users', variables.user_uuid] 
      });
      
      // Invalidate user lists
      queryClient.invalidateQueries({ 
        queryKey: ['users'] 
      });
      
      // Invalidate current user data
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.members.currentUser() 
      });
      
      // Invalidate team data for both old and new teams
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.teams.detail(variables.new_team_uuid) 
      });
      
      // Invalidate team lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.teams.lists() 
      });
    },
    
    ...options,
  });
}

/**
 * Hook to delete a member
 */
export function useDeleteMember(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMember,
    
    onSuccess: (data, memberId, context) => {
      // Remove from cache
      queryClient.removeQueries({ 
        queryKey: queryKeys.members.detail(memberId) 
      });
      
      // Invalidate member lists
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.members.lists() 
      });
      
      // Invalidate team lists (member counts might change)
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.teams.lists() 
      });
    },
    
    ...options,
  });
}
