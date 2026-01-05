import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Update Link Request payload
 */
export interface UpdateLinkRequest {
  id: string;
  name: string;
  title: string;
  description: string;
  url: string;
  category_id: string;
  tags: string;
}

/**
 * Update Link Response
 */
export interface UpdateLinkResponse {
  id: string;
  name: string;
  title: string;
  description: string;
  url: string;
  category_id: string;
  tags: string;
}

/**
 * API function to update a link
 */
async function updateLink(payload: UpdateLinkRequest): Promise<UpdateLinkResponse> {
  const { id, ...data } = payload;
  return apiClient.put<UpdateLinkResponse>(`/links/${id}`, data);
}

/**
 * Hook for updating a link
 */
export function useUpdateLink(): UseMutationResult<UpdateLinkResponse, Error, UpdateLinkRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLink,
    onSuccess: () => {
      // Invalidate current user query to refresh links list
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.currentUser()
      });
      
      // Invalidate all team queries to refresh team links
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.teams.all 
      });
      
      // Invalidate links query
      queryClient.invalidateQueries({
        queryKey: queryKeys.links.all
      });
    },
  });
}