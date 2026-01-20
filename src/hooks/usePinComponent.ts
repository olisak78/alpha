import { useAddPinnedComponent, useRemovePinnedComponent } from '@/hooks/api/mutations/useFavoriteMutations';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Component } from '@/types/api';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';

/**
 * Higher-level hook for pin/unpin functionality with optimistic updates
 * Combines authentication, API mutations, and user feedback
 */
export function usePinComponent() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const addPinnedComponent = useAddPinnedComponent();
  const removePinnedComponent = useRemovePinnedComponent();

  const togglePin = (component: Component) => {
    const componentId = component.id;
    const newPinState = !component.isPinned;

    // Optimistic update function to update all component queries
    const updateComponentInQueries = (isPinned: boolean) => {
      // Update all component queries that might contain this component
      queryClient.setQueriesData(
        { queryKey: queryKeys.components.all },
        (oldData: any) => {
          if (!oldData) return oldData;

          // Handle different response structures
          if (oldData.components && Array.isArray(oldData.components)) {
            // For ComponentListResponse and TeamComponentsListResponse
            return {
              ...oldData,
              components: oldData.components.map((comp: Component) =>
                comp.id === componentId ? { ...comp, isPinned } : comp
              ),
            };
          } else if (Array.isArray(oldData)) {
            // For direct array responses
            return oldData.map((comp: Component) =>
              comp.id === componentId ? { ...comp, isPinned } : comp
            );
          }

          return oldData;
        }
      );
    };

    // Perform optimistic update
    updateComponentInQueries(newPinState);

    if (component.isPinned) {
      // Unpin the component
      removePinnedComponent.mutate(
        { userId: user.id, componentId: component.id },
        {
          onSuccess: () => {
            toast({
              title: "Component unpinned",
              description: `${component.title || component.name} has been unpinned`,
            });
          },
          onError: () => {
            // Revert optimistic update on error
            updateComponentInQueries(true);
            
            toast({
              title: "Error",
              description: "Failed to unpin component",
              variant: "destructive",
            });
          },
        }
      );
    } else {
      // Pin the component
      addPinnedComponent.mutate(
        { userId: user.id, componentId: component.id },
        {
          onSuccess: () => {
            toast({
              title: "Component pinned",
              description: `${component.title || component.name} has been pinned`,
            });
          },
          onError: () => {
            // Revert optimistic update on error
            updateComponentInQueries(false);
            
            toast({
              title: "Error",
              description: "Failed to pin component",
              variant: "destructive",
            });
          },
        }
      );
    }
  };

  return {
    togglePin,
    isLoading: addPinnedComponent.isPending || removePinnedComponent.isPending,
  };
}
