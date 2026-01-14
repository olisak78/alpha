import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { apiClient } from '@/services/ApiClient';
import { queryKeys } from '@/lib/queryKeys';
import { queryClient } from '@/lib/queryClient';
import type {
  UserMeResponse,
  UsersListResponse,
  UsersQueryParams,
  NewUserSearchApiResponse,
  LdapUser,
  LdapUserSearchResponse,
  User,
} from '@/types/api';



/**
 * Members Query Hooks
 * 
 * Provides hooks for fetching member data with automatic caching,
 * loading states, and error handling.
 */

// ============================================================================
// QUERY FUNCTIONS
// ============================================================================

/**
 * Fetch users from the API
 */
async function fetchUsers(params: UsersQueryParams = {}): Promise<UsersListResponse> {
  const defaultParams = {
    limit: 20,
    offset: 0,
    ...params,
  };
  
  return apiClient.get<UsersListResponse>('/users', { 
    params: defaultParams as unknown as Record<string, string | number | boolean | undefined>
  });
}

/**
 * Fetch current user's data from /users/me endpoint
 */
export async function fetchCurrentUser(): Promise<UserMeResponse> {
  return apiClient.get<UserMeResponse>('/users/me');
}

/**
 * Fetch individual user data from /users/{userid} endpoint
 */
async function fetchUser(userId: string): Promise<User> {
  return apiClient.get<User>(`/users/${userId}`);
}

/**
 * Search users using the users?q= endpoint
 */
async function searchUsers(query: string): Promise<UsersListResponse> {
  return apiClient.get<UsersListResponse>('/users', { 
    params: { q: query }
  });
}

/**
 * Search users using the new API endpoint
 */
async function searchLdapUsers(name: string): Promise<LdapUserSearchResponse> {
  const response = await apiClient.get<NewUserSearchApiResponse>(`/users/search/new?name=${name}`);
  
  // Transform the API response to match our expected format
  const transformedUsers: LdapUser[] = response.result.map((apiUser) => ({
    cn: apiUser.id, // Use 'id' field as user ID
    displayName: `${apiUser.first_name} ${apiUser.last_name}`.trim(),
    email: apiUser.email,
    givenName: apiUser.first_name,
    sn: apiUser.last_name,
  }));

  return {
    users: transformedUsers,
    total: transformedUsers.length,
  };
}

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Hook to fetch current user data from /users/me endpoint
 * This replaces the useMember hook for fetching current user data
 */
export function useCurrentUser(
  options?: Omit<
    UseQueryOptions<UserMeResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<UserMeResponse, Error> {
  return useQuery({
    queryKey: queryKeys.members.currentUser(),
    queryFn: () => fetchCurrentUser(),
    ...options,
  });
}

/**
 * Hook to prefetch users list
 */
export function usePrefetchUsers() {
  return (params: UsersQueryParams = {}) => {
    return queryClient.prefetchQuery({
      queryKey: queryKeys.users.list(params),
      queryFn: () => fetchUsers(params),
    });
  };
}

/**
 * Hook to search users using the users?q= endpoint
 */
export function useUserSearch(
  query: string,
  options?: Omit<
    UseQueryOptions<UsersListResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<UsersListResponse, Error> {
  return useQuery({
    queryKey: ['users', 'search', 'q', query],
    queryFn: () => searchUsers(query),
    // Only run if we have a query parameter and it's not empty
    enabled: !!query && query.trim().length > 0 && (options?.enabled ?? true),
    // Don't refetch on window focus for search results
    refetchOnWindowFocus: false,
    // Cache search results for 5 minutes
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to search users using the new API endpoint
 */
export function useLdapUserSearch(
  name: string,
  options?: Omit<
    UseQueryOptions<LdapUserSearchResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<LdapUserSearchResponse, Error> {
  return useQuery({
    queryKey: ['users', 'search', name],
    queryFn: () => searchLdapUsers(name),
    // Only run if we have a name parameter and it's not empty
    enabled: !!name && name.trim().length > 0 && (options?.enabled ?? true),
    // Don't refetch on window focus for search results
    refetchOnWindowFocus: false,
    // Cache search results for 5 minutes
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

/**
 * Hook to fetch individual user data from /users/{userid} endpoint
 */
export function useUser(
  userId: string,
  options?: Omit<
    UseQueryOptions<User, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<User, Error> {
  return useQuery({
    queryKey: queryKeys.users.detail(userId),
    queryFn: () => fetchUser(userId),
    // Only run if we have a userId parameter and it's not empty
    enabled: !!userId && userId.trim().length > 0 && (options?.enabled ?? true),
    ...options,
  });
}

/**
 * Hook to fetch users from the API
 */
export function useUsers(
  params: UsersQueryParams = {},
  options?: Omit<
    UseQueryOptions<UsersListResponse, Error>,
    'queryKey' | 'queryFn'
  >
): UseQueryResult<UsersListResponse, Error> {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => fetchUsers(params),
    ...options,
  });
}
