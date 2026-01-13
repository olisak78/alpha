import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryKeys';
import { updateTriggeredAlertLabel } from '@/services/triggeredAlertsApi';
import type { TriggeredAlertsLabelUpdatePayload } from '@/types/api';

/**
 * Triggered Alerts Mutation Hooks
 * 
 * Provides hooks for updating triggered alerts.
 */

// ============================================================================
// MUTATION HOOKS
// ============================================================================

/**
 * Hook to update label for a specific triggered alert
 */
export function useUpdateTriggeredAlertLabel(
  options?: UseMutationOptions<
    void,
    Error,
    { projectname: string; fingerprint: string; payload: TriggeredAlertsLabelUpdatePayload }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectname, fingerprint, payload }) =>
      updateTriggeredAlertLabel(projectname, fingerprint, payload),
    
    onSuccess: (data, variables, context) => {
      // Invalidate and refetch related queries after successful update
      queryClient.invalidateQueries({
        queryKey: queryKeys.triggeredAlerts.byProject(variables.projectname),
      });
      // Invalidate all detail queries for this alert (regardless of startsAt timestamp)
      queryClient.invalidateQueries({
        queryKey: ['triggered-alerts', 'detail', variables.projectname, variables.fingerprint],
      });
    },
    
    ...options,
  });
}
