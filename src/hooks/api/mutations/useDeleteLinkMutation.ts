import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { deleteLink } from '@/services/deleteLinkApi';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Hook for deleting a link
 */
export function useDeleteLink(): UseMutationResult<void, Error, string> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (linkId: string) => deleteLink(linkId),
    onSuccess: () => {
      // Invalidate current user query to refresh links list
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.currentUser()
      });
    },
  });
}