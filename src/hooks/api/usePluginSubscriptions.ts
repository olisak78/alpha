import { useMutation, useQueryClient } from '@tanstack/react-query';
import { subscribeToPlugin, unsubscribeFromPlugin } from '@/services/pluginSubscriptions';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Hook to subscribe to a plugin (pin it)
 */
export function useSubscribeToPlugin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pluginId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return subscribeToPlugin(user.id, pluginId);
    },
    onSuccess: () => {
      // Invalidate plugins query to refetch with updated subscribed status
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      
      toast({
        title: 'Plugin pinned',
        description: 'Plugin has been added to your sidebar',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to pin plugin',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to unsubscribe from a plugin (unpin it)
 */
export function useUnsubscribeFromPlugin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (pluginId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }
      return unsubscribeFromPlugin(user.id, pluginId);
    },
    onSuccess: () => {
      // Invalidate plugins query to refetch with updated subscribed status
      queryClient.invalidateQueries({ queryKey: ['plugins'] });
      
      toast({
        title: 'Plugin unpinned',
        description: 'Plugin has been removed from your sidebar',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to unpin plugin',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}