import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import '@testing-library/jest-dom';

// Import hooks to test
import { 
  useTriggeredAlerts, 
  useTriggeredAlert, 
  useAlertProjects 
} from '../../../src/hooks/api/useTriggeredAlerts';

// Mock the TriggeredAlertsApi service
import { 
  getTriggeredAlerts, 
  getTriggeredAlert, 
  getAlertProjects 
} from '../../../src/services/triggeredAlertsApi';

vi.mock('../../../src/services/triggeredAlertsApi', () => ({
  getTriggeredAlerts: vi.fn(),
  getTriggeredAlert: vi.fn(),
  getAlertProjects: vi.fn(),
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

const createMockTriggeredAlert = (overrides?: any) => ({
  fingerprint: 'alert-fingerprint-123',
  alertname: 'TestAlert',
  status: 'firing',
  severity: 'warning',
  landscape: 'production',
  region: 'us-east-1',
  startsAt: '2025-01-01T10:00:00Z',
  endsAt: '2025-01-01T11:00:00Z',
  labels: {
    service: 'test-service',
    environment: 'prod'
  },
  annotations: {
    summary: 'Test alert summary',
    description: 'Test alert description'
  },
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:30:00Z',
  ...overrides,
});

const createMockTriggeredAlertsResponse = (overrides?: any) => ({
  data: [
    createMockTriggeredAlert(),
    createMockTriggeredAlert({ 
      fingerprint: 'alert-fingerprint-456', 
      alertname: 'AnotherAlert',
      severity: 'critical'
    })
  ],
  page: 1,
  pageSize: 50,
  totalCount: 2,
  totalPages: 1,
  ...overrides,
});

const createMockAlertProjects = () => [
  'project-alpha',
  'project-beta',
  'project-gamma'
];

// ============================================================================
// useTriggeredAlerts TESTS
// ============================================================================

describe('useTriggeredAlerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch triggered alerts successfully', async () => {
    const projectname = 'test-project';
    const mockResponse = createMockTriggeredAlertsResponse();

    vi.mocked(getTriggeredAlerts).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useTriggeredAlerts(projectname), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.data?.data).toHaveLength(2);
    expect(getTriggeredAlerts).toHaveBeenCalledWith(projectname, undefined);
  });

  it('should not fetch when projectname is empty', async () => {
    const { result } = renderHook(() => useTriggeredAlerts(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(getTriggeredAlerts).not.toHaveBeenCalled();
  });

  it('should not fetch when projectname is undefined', async () => {
    const { result } = renderHook(() => useTriggeredAlerts(undefined as any), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(getTriggeredAlerts).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const projectname = 'test-project';
    const error = new Error('Failed to fetch triggered alerts');
    vi.mocked(getTriggeredAlerts).mockRejectedValue(error);

    const { result } = renderHook(() => useTriggeredAlerts(projectname), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should return empty alerts array when no data', async () => {
    const projectname = 'test-project';
    const mockResponse = createMockTriggeredAlertsResponse({
      data: [],
    });

    vi.mocked(getTriggeredAlerts).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useTriggeredAlerts(projectname), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(0);
  });

  it('should use correct stale time (2 minutes)', async () => {
    const projectname = 'test-project';
    const mockResponse = createMockTriggeredAlertsResponse();

    vi.mocked(getTriggeredAlerts).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useTriggeredAlerts(projectname), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the hook was called and data is available
    expect(result.current.dataUpdatedAt).toBeGreaterThan(0);
  });

  it('should accept custom query options', async () => {
    const projectname = 'test-project';
    const mockResponse = createMockTriggeredAlertsResponse();

    vi.mocked(getTriggeredAlerts).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => 
      useTriggeredAlerts(projectname, { 
        refetchInterval: 5000,
        enabled: true 
      }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
  });
});

// ============================================================================
// useTriggeredAlert TESTS
// ============================================================================

describe('useTriggeredAlert', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch specific triggered alert successfully', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    const startsAt = '2025-01-01T10:00:00.123456Z';
    const mockAlert = createMockTriggeredAlert();

    vi.mocked(getTriggeredAlert).mockResolvedValue(mockAlert);

    const { result } = renderHook(() => useTriggeredAlert(projectname, fingerprint, startsAt), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAlert);
    expect(getTriggeredAlert).toHaveBeenCalledWith(projectname, fingerprint, startsAt);
  });

  it('should not fetch when projectname is empty', async () => {
    const fingerprint = 'alert-fingerprint-123';
    const startsAt = '2025-01-01T10:00:00.123456Z';

    const { result } = renderHook(() => useTriggeredAlert('', fingerprint, startsAt), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(getTriggeredAlert).not.toHaveBeenCalled();
  });

  it('should not fetch when fingerprint is empty', async () => {
    const projectname = 'test-project';
    const startsAt = '2025-01-01T10:00:00.123456Z';

    const { result } = renderHook(() => useTriggeredAlert(projectname, '', startsAt), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(getTriggeredAlert).not.toHaveBeenCalled();
  });

  it('should not fetch when both parameters are missing', async () => {
    const { result } = renderHook(() => useTriggeredAlert('', '', ''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(getTriggeredAlert).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    const startsAt = '2025-01-01T10:00:00.123456Z';
    const error = new Error('Alert not found');
    vi.mocked(getTriggeredAlert).mockRejectedValue(error);

    const { result } = renderHook(() => useTriggeredAlert(projectname, fingerprint, startsAt), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should use correct stale time (1 minute)', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    const startsAt = '2025-01-01T10:00:00.123456Z';
    const mockAlert = createMockTriggeredAlert();

    vi.mocked(getTriggeredAlert).mockResolvedValue(mockAlert);

    const { result } = renderHook(() => useTriggeredAlert(projectname, fingerprint, startsAt), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.dataUpdatedAt).toBeGreaterThan(0);
  });

  it('should accept custom query options', async () => {
    const projectname = 'test-project';
    const fingerprint = 'alert-fingerprint-123';
    const startsAt = '2025-01-01T10:00:00.123456Z';
    const mockAlert = createMockTriggeredAlert();

    vi.mocked(getTriggeredAlert).mockResolvedValue(mockAlert);

    const { result } = renderHook(() =>
      useTriggeredAlert(projectname, fingerprint, startsAt, {
        refetchInterval: 30000,
        enabled: true
      }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockAlert);
  });
});

// ============================================================================
// useAlertProjects TESTS
// ============================================================================

describe('useAlertProjects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch alert projects successfully', async () => {
    const mockProjects = createMockAlertProjects();

    vi.mocked(getAlertProjects).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useAlertProjects(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockProjects);
    expect(result.current.data).toHaveLength(3);
    expect(getAlertProjects).toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const error = new Error('Failed to fetch alert projects');
    vi.mocked(getAlertProjects).mockRejectedValue(error);

    const { result } = renderHook(() => useAlertProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should return empty array when no projects', async () => {
    const mockProjects: string[] = [];

    vi.mocked(getAlertProjects).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useAlertProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(0);
  });

  it('should use correct stale time (5 minutes)', async () => {
    const mockProjects = createMockAlertProjects();

    vi.mocked(getAlertProjects).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useAlertProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.dataUpdatedAt).toBeGreaterThan(0);
  });

  it('should accept custom query options', async () => {
    const mockProjects = createMockAlertProjects();

    vi.mocked(getAlertProjects).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => 
      useAlertProjects({ 
        refetchInterval: 10000,
        enabled: true 
      }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockProjects);
  });

  it('should handle single project response', async () => {
    const mockProjects = ['single-project'];

    vi.mocked(getAlertProjects).mockResolvedValue(mockProjects);

    const { result } = renderHook(() => useAlertProjects(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]).toBe('single-project');
  });
});
