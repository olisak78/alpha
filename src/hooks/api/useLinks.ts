import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import { queryKeys } from '@/lib/queryKeys';
import type { LinksApiResponse, CategoriesApiResponse } from '@/types/api';

/**
 * Links Query Hooks
 */

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Fetch all links
 */
async function fetchLinks(): Promise<LinksApiResponse> {
  return apiClient.get<LinksApiResponse>('/links');
}

/**
 * Fetch all categories
 */
async function fetchCategories(): Promise<CategoriesApiResponse> {
  return apiClient.get<CategoriesApiResponse>('/categories');
}

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook to fetch all links
 */
export function useLinks(
  options?: Omit<
    UseQueryOptions<LinksApiResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<LinksApiResponse, Error> {
  return useQuery({
    queryKey: queryKeys.links.all,
    queryFn: fetchLinks,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    ...options,
  });
}

/**
 * Hook to fetch all categories
 */
export function useCategories(
  options?: Omit<
    UseQueryOptions<CategoriesApiResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<CategoriesApiResponse, Error> {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: fetchCategories,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes (categories change less frequently)
    ...options,
  });
}