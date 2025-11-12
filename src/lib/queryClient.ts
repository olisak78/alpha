import { QueryClient, DefaultOptions } from '@tanstack/react-query';
import { throttledAuthRefresh, triggerAuthError } from './authRefreshService';

/**
 * Default options for TanStack Query
 * 
 * These options are carefully chosen to balance:
 * - User experience (perceived performance)
 * - Server load (request frequency)
 * - Data freshness (how often we refetch)
 * - Error resilience (retry behavior)
 */
const queryConfig: DefaultOptions = {
  queries: {
    // STALE TIME: How long data is considered fresh
    // 5 minutes - prevents unnecessary refetches for recently fetched data
    // Reasoning: Teams/members data doesn't change frequently
    staleTime: 5 * 60 * 1000, // 5 minutes

    // CACHE TIME: How long unused data stays in memory
    // 10 minutes - keeps data available for quick navigation back
    // Reasoning: User might navigate between pages frequently
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

    // RETRY: How many times to retry failed requests
    // 1 retry - be resilient to temporary network issues
    // Reasoning: Balance between user experience and not hammering server
    retry: 1,

    // RETRY DELAY: Exponential backoff for retries
    // Starts at 1s, doubles each time (1s, 2s, 4s...)
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // REFETCH ON WINDOW FOCUS: Refetch when user returns to tab
    // true - ensures data is fresh when user comes back
    // Reasoning: User expects up-to-date data after switching tabs
    refetchOnWindowFocus: true,

    // REFETCH ON RECONNECT: Refetch when internet connection restored
    // true - sync data after being offline
    refetchOnReconnect: true,

    // REFETCH ON MOUNT: Always refetch when component mounts and trigger auth refresh
    // This ensures AuthErrorHandler can be triggered both with and without cached data
    refetchOnMount: (query) => {
      // Trigger throttled auth refresh to check authentication status
      // This covers both cases: with cached data and without cached data
      // Throttling prevents multiple simultaneous refresh requests
      throttledAuthRefresh();
      
      return true; // Always return true to maintain normal React Query re-fetch behavior
    },

    // NETWORK MODE: How queries behave without internet
    // 'online' - only run queries when online
    networkMode: 'online',
  },
  mutations: {
    // RETRY: Don't retry mutations by default
    // 0 - mutations should be intentional, let user retry manually
    // Reasoning: Creating/updating data twice could cause issues
    retry: 0,

    // NETWORK MODE: Mutations require internet
    networkMode: 'online',
  },
};

/**
 * Create and export the QueryClient instance
 * 
 * This is a singleton that manages all queries and mutations.
 * It's used by the QueryClientProvider to provide React Query
 * functionality to the entire app.
 * 
 * @example
 * // In your App.tsx or main provider file:
 * import { QueryClientProvider } from '@tanstack/react-query';
 * import { queryClient } from './lib/queryClient';
 * 
 * function App() {
 *   return (
 *     <QueryClientProvider client={queryClient}>
 *       <YourApp />
 *     </QueryClientProvider>
 *   );
 * }
 */
export const queryClient = new QueryClient({
  defaultOptions: queryConfig,
});

// Add global error handling using QueryClient's event system
queryClient.getQueryCache().subscribe((event) => {
  // Handle both initial errors and background refetch errors
  if (event.type === 'updated' && event.query.state.error) {
    triggerAuthError(event.query.state.error);
  }
});

// Also set up mutation error handling 
queryClient.getMutationCache().subscribe((event) => {
  if (event.type === 'updated' && event.mutation.state.error) {
    triggerAuthError(event.mutation.state.error);
  }
});

/**
 * Helper function to clear all queries from cache
 * Useful for logout or when switching organizations
 * 
 * @example
 * // When user logs out:
 * import { clearQueryCache } from './lib/queryClient';
 * 
 * function handleLogout() {
 *   clearQueryCache();
 *   // ... rest of logout logic
 * }
 */
export function clearQueryCache() {
  queryClient.clear();
}

/**
 * Helper function to invalidate specific query patterns
 * Forces refetch of matching queries
 * 
 * @param queryKey - The query key pattern to invalidate
 * 
 * @example
 * // After creating a team, invalidate all team queries:
 * invalidateQueries(['teams']);
 * 
 * // After updating a specific team, invalidate that team's queries:
 * invalidateQueries(['teams', teamId]);
 */
export function invalidateQueries(queryKey: unknown[]) {
  return queryClient.invalidateQueries({ queryKey });
}

/**
 * Helper to prefetch data before it's needed
 * Improves perceived performance by loading data in advance
 * 
 * @param queryKey - The query key to prefetch
 * @param queryFn - The function that fetches the data
 * 
 * @example
 * // Prefetch team details when hovering over team card:
 * function TeamCard({ teamId }) {
 *   const handleHover = () => {
 *     prefetchQuery(
 *       ['teams', teamId],
 *       () => apiClient.teams.getById(teamId)
 *     );
 *   };
 *   
 *   return <div onMouseEnter={handleHover}>...</div>;
 * }
 */
export function prefetchQuery<T>(
  queryKey: unknown[],
  queryFn: () => Promise<T>
) {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
  });
}
