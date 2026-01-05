import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAlerts, createAlertPR } from '@/services/AlertsApi';
import type { Alert, AlertFile, AlertsResponse, CreateAlertPRPayload, CreateAlertPRResponse } from '@/services/AlertsApi';

export function useAlerts(projectId: string) {
  return useQuery<AlertsResponse>({
    queryKey: ['alerts', projectId],
    queryFn: () => fetchAlerts(projectId),
    enabled: !!projectId,
  });
}

export function useCreateAlertPR(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation<CreateAlertPRResponse, Error, CreateAlertPRPayload>({
    mutationFn: (payload) => createAlertPR(projectId, payload),
    onSuccess: () => {
      // Invalidate alerts query to refetch
      queryClient.invalidateQueries({ queryKey: ['alerts', projectId] });
    },
  });
}

export type { Alert, AlertFile, AlertsResponse, CreateAlertPRPayload, CreateAlertPRResponse };
