import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { addFavorite, removeFavorite } from '@/services/favoritesApi';

interface FavoriteVariables {
  userId: string;
  linkId: string;
}

/**
 * Hook for adding a link to favorites
 */
export function useAddFavorite(): UseMutationResult<void, Error, FavoriteVariables> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, linkId }: FavoriteVariables) => addFavorite(userId, linkId),
    onSuccess: () => {
      // Invalidate current user query to refresh favorites list
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.currentUser()
      });
    },
  });
}

/**
 * Hook for removing a link from favorites
 */
export function useRemoveFavorite(): UseMutationResult<void, Error, FavoriteVariables> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, linkId }: FavoriteVariables) => removeFavorite(userId, linkId),
    onSuccess: () => {
      // Invalidate current user query to refresh favorites list
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.currentUser()
      });
    },
  });
}