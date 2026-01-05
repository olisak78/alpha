import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import type {
  Documentation,
  CreateDocumentationRequest,
  UpdateDocumentationRequest,
} from '@/types/documentation';

// Query keys
export const documentationKeys = {
  all: ['documentations'] as const,
  byTeam: (teamId: string) => ['documentations', 'team', teamId] as const,
  byId: (id: string) => ['documentations', id] as const,
};

// Get documentations by team ID
export function useTeamDocumentations(teamId: string) {
  return useQuery({
    queryKey: documentationKeys.byTeam(teamId),
    queryFn: async () => {
      const response = await apiClient.get<Documentation[]>(`/teams/${teamId}/documentations`);
      return response;
    },
    enabled: !!teamId,
  });
}

// Get documentation by ID
export function useDocumentation(id: string) {
  return useQuery({
    queryKey: documentationKeys.byId(id),
    queryFn: async () => {
      const response = await apiClient.get<Documentation>(`/documentations/${id}`);
      return response;
    },
    enabled: !!id,
  });
}

// Create documentation mutation
export function useCreateDocumentation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDocumentationRequest) => {
      const response = await apiClient.post<Documentation>('/documentations', data);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate team documentations query
      queryClient.invalidateQueries({
        queryKey: documentationKeys.byTeam(data.team_id),
      });
    },
  });
}

// Update documentation mutation
export function useUpdateDocumentation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateDocumentationRequest) => {
      const response = await apiClient.patch<Documentation>(`/documentations/${id}`, data);
      return response;
    },
    onSuccess: (data) => {
      // Invalidate specific documentation and team documentations queries
      queryClient.invalidateQueries({
        queryKey: documentationKeys.byId(id),
      });
      queryClient.invalidateQueries({
        queryKey: documentationKeys.byTeam(data.team_id),
      });
    },
  });
}

// Delete documentation mutation
export function useDeleteDocumentation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, teamId }: { id: string; teamId: string }) => {
      await apiClient.delete(`/documentations/${id}`);
      return { id, teamId };
    },
    onSuccess: (data) => {
      // Invalidate team documentations query
      queryClient.invalidateQueries({
        queryKey: documentationKeys.byTeam(data.teamId),
      });
    },
  });
}
