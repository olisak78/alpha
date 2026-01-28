import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { vi } from 'vitest';

/**
 * Creates a fresh QueryClient for each test to ensure isolation
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
        gcTime: 0, // Don't cache between tests (garbage collection time)
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Wrapper component that provides QueryClient context
 */
export function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return QueryClientProvider({ client: queryClient, children });
  };
}

/**
 * Mock toast hook for testing
 */
export const mockToast = vi.fn();
export const mockUseToast = () => ({
  toast: mockToast,
});

/**
 * Common test setup and cleanup utilities
 */
export const testSetup = {
  beforeEach: () => {
    vi.clearAllMocks();
  },
  afterEach: () => {
    vi.restoreAllMocks();
  },
};
