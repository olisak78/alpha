import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import '@testing-library/jest-dom';

// Import hooks to test
import { useUpdateTriggeredAlertLabel } from '../../../src/hooks/api/mutations/useTriggeredAlertsMutations';

// Mock the TriggeredAlertsApi service
import { updateTriggeredAlertLabel } from '../../../src/services/triggeredAlertsApi';

vi.mock('../../../src/services/triggeredAlertsApi', () => ({
  updateTriggeredAlertLabel: vi.fn(),
}));

// ============================================================================
// TEST UTILITIES
// ============================================================================

/**
 * Creates a fresh QueryClient for each test to ensure isolation
 */
function createTestQueryClient() {
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
function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockLabelUpdatePayload = (overrides?: any) => ({
  fingerprint: 'alert-fingerprint-123',
  label: {
    key: 'status',
    value: 'resolved'
  },
  message: 'Alert resolved by user',
  project: 'test-project',
  ...overrides,
});

// ============================================================================
// useUpdateTriggeredAlertLabel TESTS
// ============================================================================

describe('useUpdateTriggeredAlertLabel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should update triggered alert label successfully', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    const payload = createMockLabelUpdatePayload();

    vi.mocked(updateTriggeredAlertLabel).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateTriggeredAlertLabel(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    result.current.mutate({ projectname, fingerprint, payload });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeUndefined(); // PUT request returns void
    expect(updateTriggeredAlertLabel).toHaveBeenCalledWith(projectname, fingerprint, payload);
  });

  it('should handle mutation errors', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    const payload = createMockLabelUpdatePayload();
    const error = new Error('Failed to update alert label');

    vi.mocked(updateTriggeredAlertLabel).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateTriggeredAlertLabel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ projectname, fingerprint, payload });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should invalidate related queries on success', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    const payload = createMockLabelUpdatePayload();

    vi.mocked(updateTriggeredAlertLabel).mockResolvedValue(undefined);

    // Create a spy on the query client
    const queryClient = createTestQueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateTriggeredAlertLabel(), {
      wrapper,
    });

    result.current.mutate({ projectname, fingerprint, payload });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should invalidate both the project alerts list and the specific alert detail
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['triggered-alerts', 'by-project', projectname, undefined],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: ['triggered-alerts', 'detail', projectname, fingerprint],
    });
    expect(invalidateQueriesSpy).toHaveBeenCalledTimes(2);
  });

  it('should handle multiple mutations sequentially', async () => {
    const projectname = 'test-project';
    const fingerprint1 = 'alert-fingerprint-123';
    const fingerprint2 = 'alert-fingerprint-456';
    const payload1 = createMockLabelUpdatePayload({ 
      fingerprint: fingerprint1,
      label: { key: 'status', value: 'resolved' }
    });
    const payload2 = createMockLabelUpdatePayload({ 
      fingerprint: fingerprint2,
      label: { key: 'priority', value: 'low' }
    });

    vi.mocked(updateTriggeredAlertLabel)
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useUpdateTriggeredAlertLabel(), {
      wrapper: createWrapper(),
    });

    // First mutation
    result.current.mutate({ projectname, fingerprint: fingerprint1, payload: payload1 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Reset mutation state
    result.current.reset();

    // Second mutation
    result.current.mutate({ projectname, fingerprint: fingerprint2, payload: payload2 });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateTriggeredAlertLabel).toHaveBeenCalledTimes(2);
    expect(updateTriggeredAlertLabel).toHaveBeenNthCalledWith(1, projectname, fingerprint1, payload1);
    expect(updateTriggeredAlertLabel).toHaveBeenNthCalledWith(2, projectname, fingerprint2, payload2);
  });

  it('should handle different label types', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    
    const statusPayload = createMockLabelUpdatePayload({
      label: { key: 'status', value: 'acknowledged' }
    });

    vi.mocked(updateTriggeredAlertLabel).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateTriggeredAlertLabel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ projectname, fingerprint, payload: statusPayload });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateTriggeredAlertLabel).toHaveBeenCalledWith(projectname, fingerprint, statusPayload);
  });

  it('should handle payload without message', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    const payload = createMockLabelUpdatePayload({
      message: undefined
    });

    vi.mocked(updateTriggeredAlertLabel).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateTriggeredAlertLabel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ projectname, fingerprint, payload });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateTriggeredAlertLabel).toHaveBeenCalledWith(projectname, fingerprint, payload);
  });

  it('should accept custom mutation options', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    const payload = createMockLabelUpdatePayload();
    const onSuccessMock = vi.fn();
    const onErrorMock = vi.fn();

    vi.mocked(updateTriggeredAlertLabel).mockResolvedValue(undefined);

    const { result } = renderHook(() => 
      useUpdateTriggeredAlertLabel({
        onSuccess: onSuccessMock,
        onError: onErrorMock,
      }), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ projectname, fingerprint, payload });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(onSuccessMock).toHaveBeenCalled();
    expect(onErrorMock).not.toHaveBeenCalled();
  });

  it('should call custom onError when mutation fails', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    const payload = createMockLabelUpdatePayload();
    const onSuccessMock = vi.fn();
    const onErrorMock = vi.fn();
    const error = new Error('Network error');

    vi.mocked(updateTriggeredAlertLabel).mockRejectedValue(error);

    const { result } = renderHook(() => 
      useUpdateTriggeredAlertLabel({
        onSuccess: onSuccessMock,
        onError: onErrorMock,
      }), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ projectname, fingerprint, payload });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(onErrorMock).toHaveBeenCalled();
    expect(onSuccessMock).not.toHaveBeenCalled();
  });

  it('should handle 404 error when alert not found', async () => {
    const projectname = 'test-project';
    const fingerprint = 'non-existent-fingerprint';
    const payload = createMockLabelUpdatePayload();
    const error = new Error('Alert not found');

    vi.mocked(updateTriggeredAlertLabel).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateTriggeredAlertLabel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ projectname, fingerprint, payload });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });

  it('should handle validation errors', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    const payload = createMockLabelUpdatePayload({
      label: { key: '', value: '' } // Invalid label
    });
    const error = new Error('Invalid label data');

    vi.mocked(updateTriggeredAlertLabel).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateTriggeredAlertLabel(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ projectname, fingerprint, payload });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });

  it('should not invalidate queries when mutation fails', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    const payload = createMockLabelUpdatePayload();
    const error = new Error('Update failed');

    vi.mocked(updateTriggeredAlertLabel).mockRejectedValue(error);

    // Create a spy on the query client
    const queryClient = createTestQueryClient();
    const invalidateQueriesSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useUpdateTriggeredAlertLabel(), {
      wrapper,
    });

    result.current.mutate({ projectname, fingerprint, payload });

    await waitFor(() => expect(result.current.isError).toBe(true));

    // Should not invalidate queries when mutation fails
    expect(invalidateQueriesSpy).not.toHaveBeenCalled();
  });
});
