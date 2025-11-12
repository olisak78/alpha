import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import { queryKeys } from '@/lib/queryKeys';
import type {
  Organization,
  OrganizationListResponse,
  PaginationParams,
} from '@/types/api';

/**
 * Organizations Query Hooks
 */

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Fetch all organizations with pagination
 */
async function fetchOrganizations(params?: PaginationParams): Promise<OrganizationListResponse> {
  return apiClient.get<OrganizationListResponse>('/organizations', { 
    params: params as Record<string, string | number | boolean | undefined>
  });
}

/**
 * Fetch a single organization by ID
 */
async function fetchOrganizationById(id: string): Promise<Organization> {
  return apiClient.get<Organization>(`/organizations/${id}`);
}

/**
 * Fetch organization by name
 */
async function fetchOrganizationByName(name: string): Promise<Organization> {
  return apiClient.get<Organization>(`/organizations/by-name/${name}`);
}

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook to fetch all organizations
 */
export function useOrganizations(
  params?: PaginationParams,
  options?: Omit<
    UseQueryOptions<OrganizationListResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<OrganizationListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.organizations.list(params),
    queryFn: () => fetchOrganizations(params),
    ...options,
  });
}

/**
 * Hook to fetch a single organization by ID
 */
export function useOrganization(
  id: string,
  options?: Omit<
    UseQueryOptions<Organization, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<Organization, Error> {
  return useQuery({
    queryKey: queryKeys.organizations.detail(id),
    queryFn: () => fetchOrganizationById(id),
    enabled: !!id && (options?.enabled ?? true),
    ...options,
  });
}

/**
 * Hook to fetch organization by name
 * This is useful when you know the organization name but not the ID.
 * The organization ID can then be used for fetching related data (teams, members, etc.)
 */
export function useOrganizationByName(
  name: string,
  options?: Omit<
    UseQueryOptions<Organization, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<Organization, Error> {
  return useQuery({
    queryKey: queryKeys.organizations.byName(name),
    queryFn: () => fetchOrganizationByName(name),
    enabled: !!name && (options?.enabled ?? true),
    staleTime: 5 * 60 * 1000, // 5 minutes - organizations don't change often
    ...options,
  });
}

/**
 * Hook to prefetch organizations list
 */
export function usePrefetchOrganizations() {
  const { queryClient } = require('@/lib/queryClient');
  
  return (params?: PaginationParams) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.organizations.list(params),
      queryFn: () => fetchOrganizations(params),
    });
  };
}

/**
 * Hook to prefetch a specific organization
 */
export function usePrefetchOrganization() {
  const { queryClient } = require('@/lib/queryClient');
  
  return (id: string) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.organizations.detail(id),
      queryFn: () => fetchOrganizationById(id),
    });
  };
}