import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import SelfServicePage from '../../../../src/pages/SelfServicePage';
import { useFetchJenkinsJobParameters } from '../../../../src/hooks/api/useSelfService';
import { useTriggerJenkinsJob } from '../../../../src/hooks/api/mutations/useSelfServiceMutations';
import { toast } from '../../../../src/components/ui/use-toast';

// Create typed mock functions
export const createMockHooks = () => ({
  mockUseFetchJenkinsJobParameters: vi.mocked(useFetchJenkinsJobParameters),
  mockUseTriggerJenkinsJob: vi.mocked(useTriggerJenkinsJob),
  mockToast: vi.mocked(toast)
});

// Render component helper
export const renderSelfServicePage = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    React.createElement(MemoryRouter, null,
      React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(SelfServicePage)
      )
    )
  );
};

// Setup default mock return values
export const setupDefaultMocks = () => {
  const mocks = createMockHooks();
  
  mocks.mockUseFetchJenkinsJobParameters.mockReturnValue({
    data: undefined,
    isLoading: false,
    error: null,
    isError: false,
    isSuccess: false,
    refetch: vi.fn(),
  } as any);

  mocks.mockUseTriggerJenkinsJob.mockReturnValue({
    mutate: vi.fn(),
    isPending: false,
    isError: false,
    error: null,
    data: undefined,
    isSuccess: false,
  } as any);

  // Setup fetch mock for static data loading
  vi.mocked(global.fetch).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ parameterDefinitions: [] })
  } as any);

  return mocks;
};

// Mock fetch response helper
export const mockFetchResponse = (data: any) => {
  vi.mocked(global.fetch).mockResolvedValueOnce({
    ok: true,
    json: () => Promise.resolve(data)
  } as any);
};

// Mock fetch error helper
export const mockFetchError = (error: Error) => {
  vi.mocked(global.fetch).mockRejectedValueOnce(error);
};
