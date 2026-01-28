import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useAlerts, useCreateAlertPR } from '../../../src/hooks/api/useAlerts';
import { fetchAlerts, createAlertPR } from '../../../src/services/AlertsApi';
import { createWrapper, testSetup } from './test-utils';

// Mock the AlertsApi service
vi.mock('../../../src/services/AlertsApi', () => ({
  fetchAlerts: vi.fn(),
  createAlertPR: vi.fn(),
}));

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockAlert = (overrides?: any) => ({
  id: 'alert-123',
  name: 'Test Alert',
  description: 'Test alert description',
  severity: 'warning',
  status: 'active',
  createdAt: '2025-01-01T10:00:00Z',
  updatedAt: '2025-01-01T10:30:00Z',
  ...overrides,
});

const createMockAlertFile = (overrides?: any) => ({
  path: 'alerts/test-alert.yml',
  content: 'alert: test content',
  sha: 'abc123',
  ...overrides,
});

const createMockAlertsResponse = (overrides?: any) => ({
  alerts: [
    createMockAlert(),
    createMockAlert({ id: 'alert-456', name: 'Another Alert', severity: 'critical' })
  ],
  files: [
    createMockAlertFile(),
    createMockAlertFile({ path: 'alerts/another-alert.yml', sha: 'def456' })
  ],
  ...overrides,
});

const createMockCreateAlertPRPayload = (overrides?: any) => ({
  title: 'Add new alert',
  description: 'Adding a new alert configuration',
  files: [
    {
      path: 'alerts/new-alert.yml',
      content: 'new alert content'
    }
  ],
  ...overrides,
});

const createMockCreateAlertPRResponse = (overrides?: any) => ({
  prNumber: 123,
  prUrl: 'https://github.com/test/repo/pull/123',
  status: 'created',
  ...overrides,
});

// ============================================================================
// useAlerts TESTS
// ============================================================================

describe('useAlerts', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch alerts successfully', async () => {
    const projectId = 'test-project';
    const mockResponse = createMockAlertsResponse();

    vi.mocked(fetchAlerts).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAlerts(projectId), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(result.current.data?.alerts).toHaveLength(2);
    expect(fetchAlerts).toHaveBeenCalledWith(projectId);
  });

  it('should not fetch when projectId is empty', async () => {
    const { result } = renderHook(() => useAlerts(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchAlerts).not.toHaveBeenCalled();
  });


  it('should handle API errors', async () => {
    const projectId = 'test-project';
    const error = new Error('Failed to fetch alerts');
    vi.mocked(fetchAlerts).mockRejectedValue(error);

    const { result } = renderHook(() => useAlerts(projectId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should return empty alerts when no data', async () => {
    const projectId = 'test-project';
    const mockResponse = createMockAlertsResponse({
      alerts: [],
      files: [],
    });

    vi.mocked(fetchAlerts).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAlerts(projectId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.alerts).toHaveLength(0);
    expect(result.current.data?.files).toHaveLength(0);
  });

});

// ============================================================================
// useCreateAlertPR TESTS
// ============================================================================

describe('useCreateAlertPR', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should create alert PR successfully', async () => {
    const projectId = 'test-project';
    const payload = createMockCreateAlertPRPayload();
    const mockResponse = createMockCreateAlertPRResponse();

    vi.mocked(createAlertPR).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateAlertPR(projectId), {
      wrapper: createWrapper(),
    });

    expect(result.current.isIdle).toBe(true);

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(createAlertPR).toHaveBeenCalledWith(projectId, payload);
  });

  it('should handle mutation errors', async () => {
    const projectId = 'test-project';
    const payload = createMockCreateAlertPRPayload();
    const error = new Error('Failed to create PR');

    vi.mocked(createAlertPR).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateAlertPR(projectId), {
      wrapper: createWrapper(),
    });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should invalidate alerts query on success', async () => {
    const projectId = 'test-project';
    const payload = createMockCreateAlertPRPayload();
    const mockResponse = createMockCreateAlertPRResponse();

    vi.mocked(createAlertPR).mockResolvedValue(mockResponse);

    // First, set up alerts query
    const mockAlertsResponse = createMockAlertsResponse();
    vi.mocked(fetchAlerts).mockResolvedValue(mockAlertsResponse);

    const wrapper = createWrapper();

    // Render alerts hook first to populate cache
    const { result: alertsResult } = renderHook(() => useAlerts(projectId), {
      wrapper,
    });

    await waitFor(() => expect(alertsResult.current.isSuccess).toBe(true));

    // Now render the mutation hook
    const { result: mutationResult } = renderHook(() => useCreateAlertPR(projectId), {
      wrapper,
    });

    // Execute mutation
    mutationResult.current.mutate(payload);

    await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true));

    // Verify the mutation was successful
    expect(mutationResult.current.data).toEqual(mockResponse);
    expect(createAlertPR).toHaveBeenCalledWith(projectId, payload);
  });

  it('should handle multiple file uploads in payload', async () => {
    const projectId = 'test-project';
    const payload = createMockCreateAlertPRPayload({
      files: [
        { path: 'alerts/alert1.yml', content: 'alert 1 content' },
        { path: 'alerts/alert2.yml', content: 'alert 2 content' },
        { path: 'alerts/alert3.yml', content: 'alert 3 content' },
      ]
    });
    const mockResponse = createMockCreateAlertPRResponse();

    vi.mocked(createAlertPR).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateAlertPR(projectId), {
      wrapper: createWrapper(),
    });

    result.current.mutate(payload);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(createAlertPR).toHaveBeenCalledWith(projectId, payload);
  });

});
