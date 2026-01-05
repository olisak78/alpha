import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import { queryKeys } from '@/lib/queryKeys';
import type { CreateQuickLinkRequest, QuickLink } from '@/types/api';

async function createQuickLink({
  memberId,
  data
}: {
  memberId: string;
  data: CreateQuickLinkRequest
}): Promise<QuickLink> {
  return apiClient.post<QuickLink>(`/members/${memberId}/quick-links`, data);
}

async function deleteQuickLink({
  memberId,
  url
}: {
  memberId: string;
  url: string
}): Promise<void> {
  return apiClient.delete(`/members/${memberId}/quick-links?url=${encodeURIComponent(url)}`);
}

export function useCreateQuickLink(
  options?: UseMutationOptions<
    QuickLink,
    Error,
    { memberId: string; data: CreateQuickLinkRequest }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuickLink,
    ...options,
    onSuccess: async (data, variables, context) => {

      await queryClient.invalidateQueries({
        queryKey: queryKeys.quickLinks.byMember(variables.memberId),
      });

      if (options?.onSuccess) {
        options.onSuccess(data, variables, context, undefined);
      }
    },

  });
}

export function useDeleteQuickLink(
  options?: UseMutationOptions<
    void,
    Error,
    { memberId: string; url: string }
  >
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteQuickLink,
    ...options, 

    onSuccess: async (data, variables, context) => {
      await queryClient.invalidateQueries({
        queryKey: queryKeys.quickLinks.byMember(variables.memberId),
      });
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context, undefined);
      }
    },
  });
}