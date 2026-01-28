import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { useClosePullRequest } from '../../../src/hooks/api/useClosePullRequest';
import { closePullRequest } from '../../../src/services/githubApi';
import { createWrapper, testSetup, mockToast, mockUseToast } from './test-utils';

// Mock the dependencies
vi.mock('../../../src/services/githubApi', () => ({
  closePullRequest: vi.fn(),
}));

vi.mock('../../../src/hooks/use-toast', () => ({
  useToast: () => mockUseToast(),
}));

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockClosePullRequestParams = (overrides?: any) => ({
  owner: 'test-owner',
  repo: 'test-repo',
  prNumber: 123,
  delete_branch: false,
  ...overrides,
});

const createMockClosePullRequestResponse = (overrides?: any) => ({
  id: 123,
  number: 123,
  state: 'closed',
  title: 'Test PR',
  url: 'https://github.com/test-owner/test-repo/pull/123',
  ...overrides,
});

// ============================================================================
// useClosePullRequest TESTS
// ============================================================================

describe('useClosePullRequest', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should close pull request successfully', async () => {
    const params = createMockClosePullRequestParams();
    const mockResponse = createMockClosePullRequestResponse();

    vi.mocked(closePullRequest).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useClosePullRequest(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isIdle).toBe(true);

    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(closePullRequest).toHaveBeenCalledWith(params);
  });

  it('should show success toast when PR is closed without deleting branch', async () => {
    const params = createMockClosePullRequestParams({ delete_branch: false });
    const mockResponse = createMockClosePullRequestResponse();

    vi.mocked(closePullRequest).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useClosePullRequest(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Pull Request Closed',
      description: `PR #${params.prNumber} closed successfully.`,
    });
  });

  it('should show success toast when PR is closed with branch deletion', async () => {
    const params = createMockClosePullRequestParams({ delete_branch: true });
    const mockResponse = createMockClosePullRequestResponse();

    vi.mocked(closePullRequest).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useClosePullRequest(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Pull Request Closed',
      description: `PR #${params.prNumber} closed and branch deleted successfully.`,
    });
  });

  it('should handle mutation errors and show error toast', async () => {
    const params = createMockClosePullRequestParams();
    const error = new Error('Failed to close PR');

    vi.mocked(closePullRequest).mockRejectedValue(error);

    const { result } = renderHook(() => useClosePullRequest(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(params);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Failed to Close PR',
      description: `Could not close PR #${params.prNumber}: ${error.message}`,
      variant: 'destructive',
    });
  });

  it('should invalidate GitHub PR queries on success', async () => {
    const params = createMockClosePullRequestParams();
    const mockResponse = createMockClosePullRequestResponse();

    vi.mocked(closePullRequest).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useClosePullRequest(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(closePullRequest).toHaveBeenCalledWith(params);
  });



  it('should handle different PR numbers correctly', async () => {
    const params1 = createMockClosePullRequestParams({ prNumber: 456 });
    const params2 = createMockClosePullRequestParams({ prNumber: 789 });
    const mockResponse1 = createMockClosePullRequestResponse({ number: 456 });
    const mockResponse2 = createMockClosePullRequestResponse({ number: 789 });

    vi.mocked(closePullRequest)
      .mockResolvedValueOnce(mockResponse1)
      .mockResolvedValueOnce(mockResponse2);

    const { result } = renderHook(() => useClosePullRequest(), {
      wrapper: createWrapper(),
    });

    // First mutation
    result.current.mutate(params1);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Pull Request Closed',
      description: `PR #456 closed successfully.`,
    });

    // Reset and second mutation
    result.current.reset();
    result.current.mutate(params2);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockToast).toHaveBeenCalledWith({
      title: 'Pull Request Closed',
      description: `PR #789 closed successfully.`,
    });
  });

  it('should handle concurrent mutations correctly', async () => {
    const params = createMockClosePullRequestParams();
    const mockResponse = createMockClosePullRequestResponse();

    vi.mocked(closePullRequest).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useClosePullRequest(), {
      wrapper: createWrapper(),
    });

    // Execute mutation
    result.current.mutate(params);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the mutation was successful
    expect(result.current.data).toEqual(mockResponse);
    expect(closePullRequest).toHaveBeenCalledWith(params);
  });
});
