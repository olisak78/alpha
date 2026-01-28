import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useConcourse } from '../../../src/hooks/api/useConcourse';
import { fetchConcourseJobs } from '../../../src/services/concourseApi';
import { createWrapper, testSetup } from './test-utils';

// Mock the concourseApi service
vi.mock('../../../src/services/concourseApi', () => ({
  fetchConcourseJobs: vi.fn(),
}));

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockConcourseJob = (overrides?: any) => ({
  id: 'job-123',
  name: 'test-job',
  pipeline: 'test-pipeline',
  team: 'test-team',
  status: 'succeeded',
  startTime: '2025-01-01T10:00:00Z',
  endTime: '2025-01-01T10:30:00Z',
  duration: 1800,
  buildNumber: 42,
  url: 'https://concourse.example.com/teams/test-team/pipelines/test-pipeline/jobs/test-job',
  ...overrides,
});

const createMockConcourseJobsResponse = (overrides?: any) => ({
  'cf-ae01': [
    createMockConcourseJob(),
    createMockConcourseJob({
      id: 'job-456',
      name: 'another-job',
      status: 'failed',
    }),
  ],
  'cf-ae02': [
    createMockConcourseJob({
      id: 'job-789',
      name: 'third-job',
      status: 'running',
    }),
  ],
  ...overrides,
});

// ============================================================================
// useConcourse TESTS
// ============================================================================

describe('useConcourse', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch Concourse jobs successfully with default options', async () => {
    const mockResponse = createMockConcourseJobsResponse();

    vi.mocked(fetchConcourseJobs).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useConcourse(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.jobsByLandscape).toEqual(mockResponse);
    expect(result.current.jobs).toHaveLength(3); // Flattened from all landscapes
    expect(result.current.error).toBeNull();
    expect(fetchConcourseJobs).toHaveBeenCalledWith('all');
  });

  it('should fetch jobs for specific landscape', async () => {
    const landscape = 'cf-ae01';
    const mockResponse = createMockConcourseJobsResponse();

    vi.mocked(fetchConcourseJobs).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useConcourse({ landscape }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.jobsByLandscape).toEqual(mockResponse);
    expect(fetchConcourseJobs).toHaveBeenCalledWith(landscape);
  });

  it('should not fetch when enabled is false', async () => {
    const { result } = renderHook(() => useConcourse({ enabled: false }), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(fetchConcourseJobs).not.toHaveBeenCalled();
  });


  it('should flatten jobs from all landscapes correctly', async () => {
    const mockResponse = {
      'landscape-1': [
        createMockConcourseJob({ id: 'job-1', name: 'job-1' }),
        createMockConcourseJob({ id: 'job-2', name: 'job-2' }),
      ],
      'landscape-2': [
        createMockConcourseJob({ id: 'job-3', name: 'job-3' }),
      ],
      'landscape-3': [
        createMockConcourseJob({ id: 'job-4', name: 'job-4' }),
        createMockConcourseJob({ id: 'job-5', name: 'job-5' }),
        createMockConcourseJob({ id: 'job-6', name: 'job-6' }),
      ],
    };

    vi.mocked(fetchConcourseJobs).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useConcourse(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.jobs).toHaveLength(6);
    expect(result.current.jobs.map(job => job.id)).toEqual([
      'job-1', 'job-2', 'job-3', 'job-4', 'job-5', 'job-6'
    ]);
  });

  it('should handle empty response', async () => {
    const mockResponse = {};

    vi.mocked(fetchConcourseJobs).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useConcourse(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.jobs).toHaveLength(0);
    expect(result.current.jobsByLandscape).toEqual({});
    expect(result.current.error).toBeNull();
  });




  it('should provide refetch function', async () => {
    const mockResponse = createMockConcourseJobsResponse();

    vi.mocked(fetchConcourseJobs).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useConcourse(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(typeof result.current.refetch).toBe('function');

    // Test refetch
    vi.mocked(fetchConcourseJobs).mockClear();
    vi.mocked(fetchConcourseJobs).mockResolvedValue(mockResponse);

    result.current.refetch();

    await waitFor(() => expect(fetchConcourseJobs).toHaveBeenCalledTimes(1));
  });

  it('should handle different landscape options correctly', async () => {
    const mockResponse = createMockConcourseJobsResponse();

    vi.mocked(fetchConcourseJobs).mockResolvedValue(mockResponse);

    // Test with specific landscape
    const { result: result1 } = renderHook(
      () => useConcourse({ landscape: 'cf-ae01' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result1.current.isLoading).toBe(false));
    expect(fetchConcourseJobs).toHaveBeenCalledWith('cf-ae01');

    // Test with 'all' landscape
    const { result: result2 } = renderHook(
      () => useConcourse({ landscape: 'all' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result2.current.isLoading).toBe(false));
    expect(fetchConcourseJobs).toHaveBeenCalledWith('all');
  });

  it('should handle non-array landscape values gracefully', async () => {
    const mockResponse = {
      'landscape-1': [createMockConcourseJob({ id: 'job-1' })],
      'landscape-2': null, // Non-array value
      'landscape-3': undefined, // Non-array value
      'landscape-4': [createMockConcourseJob({ id: 'job-2' })],
    };

    vi.mocked(fetchConcourseJobs).mockResolvedValue(mockResponse as any);

    const { result } = renderHook(() => useConcourse(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Should only include jobs from valid arrays
    expect(result.current.jobs).toHaveLength(2);
    expect(result.current.jobs.map(job => job.id)).toEqual(['job-1', 'job-2']);
  });


  it('should maintain correct query key for different landscapes', async () => {
    const mockResponse = createMockConcourseJobsResponse();

    vi.mocked(fetchConcourseJobs).mockResolvedValue(mockResponse);

    // Test different landscapes to ensure they have different cache keys
    const { result: result1 } = renderHook(
      () => useConcourse({ landscape: 'cf-ae01' }),
      { wrapper: createWrapper() }
    );

    const { result: result2 } = renderHook(
      () => useConcourse({ landscape: 'cf-ae02' }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result1.current.isLoading).toBe(false);
      expect(result2.current.isLoading).toBe(false);
    });

    // Both should have been called with their respective landscapes
    expect(fetchConcourseJobs).toHaveBeenCalledWith('cf-ae01');
    expect(fetchConcourseJobs).toHaveBeenCalledWith('cf-ae02');
  });
});
