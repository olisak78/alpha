import { useMutation, UseMutationResult, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { addFavorite, removeFavorite, addPinnedComponent, removePinnedComponent } from '@/services/favoritesApi';

interface FavoriteVariables {
  userId: string;
  linkId: string;
}

interface PinnedComponentVariables {
  userId: string;
  componentId: string;
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

/**
 * Hook for adding a component to pinned components
 */
export function useAddPinnedComponent(): UseMutationResult<void, Error, PinnedComponentVariables> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, componentId }: PinnedComponentVariables) => addPinnedComponent(userId, componentId),
    onSuccess: () => {
      // Invalidate current user query to refresh pinned components list
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.currentUser()
      });
    },
  });
}

/**
 * Hook for removing a component from pinned components
 */
export function useRemovePinnedComponent(): UseMutationResult<void, Error, PinnedComponentVariables> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, componentId }: PinnedComponentVariables) => removePinnedComponent(userId, componentId),
    onSuccess: () => {
      // Invalidate current user query to refresh pinned components list
      queryClient.invalidateQueries({
        queryKey: queryKeys.members.currentUser()
      });
    },
  });
}
