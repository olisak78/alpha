import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import { queryKeys } from '@/lib/queryKeys';

// ============================================================================
// MUTATION FUNCTIONS
// ============================================================================

/**
 * Delete a link by ID
 */
async function deleteLink(linkId: string): Promise<void> {
  return apiClient.delete(`/links/${linkId}`);
}

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to delete a link by ID
 */
export function useDeleteLink(
  options?: UseMutationOptions<void, Error, string>
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteLink,
    
    onSuccess: async (data, linkId, context) => {
      // Invalidate all team lists and detail queries since links might be associated with teams
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.teams.lists() 
      });
      
      // Invalidate all team detail queries to refresh links data
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.teams.all 
      });
      
      // Call the user-provided onSuccess callback if it exists
      if (options?.onSuccess) {
        options.onSuccess(data, linkId, context, undefined);
      }
    },
    
    ...options,
  });
}
