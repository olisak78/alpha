import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useComponentHealth } from '../../../src/hooks/api/useComponentHealth';
import { fetchComponentHealth } from '../../../src/services/healthApi';
import { createWrapper, testSetup } from './test-utils';

// Mock the healthApi service
vi.mock('../../../src/services/healthApi', () => ({
  fetchComponentHealth: vi.fn(),
}));

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockHealthResponse = (overrides?: any) => ({
  status: 'UP',
  checks: {
    database: { status: 'UP', responseTime: 50 },
    redis: { status: 'UP', responseTime: 25 },
    external_api: { status: 'DOWN', responseTime: 5000, error: 'Timeout' },
  },
  timestamp: '2025-01-01T10:00:00Z',
  version: '1.0.0',
  ...overrides,
});

const createMockComponentHealthResult = (overrides?: any) => ({
  status: 'success' as const,
  data: createMockHealthResponse(),
  responseTime: 150,
  ...overrides,
});

// ============================================================================
// useComponentHealth TESTS
// ============================================================================

describe('useComponentHealth', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch component health successfully when enabled', async () => {
    const componentId = 'component-123';
    const landscapeId = 'landscape-456';
    const hasHealth = true;
    const mockResult = createMockComponentHealthResult();

    vi.mocked(fetchComponentHealth).mockResolvedValue(mockResult);

    const { result } = renderHook(
      () => useComponentHealth(componentId, landscapeId, hasHealth),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResult);
    expect(fetchComponentHealth).toHaveBeenCalledWith(
      componentId,
      landscapeId,
      expect.any(AbortSignal)
    );
  });

  it('should not fetch when hasHealth is false', async () => {
    const { result } = renderHook(
      () => useComponentHealth('component-123', 'landscape-456', false),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchComponentHealth).not.toHaveBeenCalled();
  });

  it('should not fetch when required parameters are missing', async () => {
    const { result } = renderHook(
      () => useComponentHealth(undefined, null, true),
      { wrapper: createWrapper() }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(fetchComponentHealth).not.toHaveBeenCalled();
  });

  it('should handle error status in response', async () => {
    const mockResult = createMockComponentHealthResult({
      status: 'error',
      error: 'Service unavailable',
      data: undefined,
    });

    vi.mocked(fetchComponentHealth).mockResolvedValue(mockResult);

    const { result } = renderHook(
      () => useComponentHealth('component-123', 'landscape-456', true),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe('error');
    expect(result.current.data?.error).toBe('Service unavailable');
    expect(result.current.data?.data).toBeUndefined();
  });
});
