import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import { queryKeys } from '@/lib/queryKeys';
import { queryClient } from '@/lib/queryClient';
import type { QuickLinksResponse } from '@/types/api';


const STORAGE_KEY = 'quick-links';

async function fetchQuickLinks(memberId: string): Promise<QuickLinksResponse> {
   return await apiClient.get<QuickLinksResponse>(`/members/${memberId}/quick-links`);
  }

export function useQuickLinks(
  memberId: string,
  options?: Omit<
    UseQueryOptions<QuickLinksResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<QuickLinksResponse, Error> {
  return useQuery({
    queryKey: queryKeys.quickLinks.byMember(memberId),
    queryFn: async () => {
      const data = await fetchQuickLinks(memberId);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.quick_links));
      } catch (error) {
        console.error('Failed to save quick links to localStorage:', error);
      }
      
      return data;
    },
    
    enabled: !!memberId && (options?.enabled ?? true),
    
    // Cache for 10 minutes - quick links don't change frequently
    staleTime: 10 * 60 * 1000,
    
    // Initialize with data from localStorage if available
    initialData: () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const quick_links = JSON.parse(stored);
          return { quick_links };
        }
      } catch (error) {
        console.error('Failed to load quick links from localStorage:', error);
      }
      return undefined;
    },
  
    ...options,
  });
}

export function usePrefetchQuickLinks() {
  return (memberId: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.quickLinks.byMember(memberId),
      queryFn: () => fetchQuickLinks(memberId),
    });
  };
}