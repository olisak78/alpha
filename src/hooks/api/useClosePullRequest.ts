// src/hooks/api/useClosePullRequest.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { closePullRequest } from '@/services/githubApi';
import { useToast } from '@/hooks/use-toast';
import { ClosePullRequestParams } from '@/types/developer-portal';

export function useClosePullRequest() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (params: ClosePullRequestParams) => closePullRequest(params),
    onSuccess: (data, variables) => {
      // Invalidate PR queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['github', 'pull-requests'] });

      toast({
        title: 'Pull Request Closed',
        description: variables.delete_branch
          ? `PR #${variables.prNumber} closed and branch deleted successfully.`
          : `PR #${variables.prNumber} closed successfully.`,
      });
    },
    onError: (error: Error, variables) => {
      toast({
        title: 'Failed to Close PR',
        description: `Could not close PR #${variables.prNumber}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
}