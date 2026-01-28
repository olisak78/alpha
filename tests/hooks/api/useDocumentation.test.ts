import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import {
  useTeamDocumentations,
  useDocumentation,
  useCreateDocumentation,
  useUpdateDocumentation,
  useDeleteDocumentation,
  documentationKeys,
} from '../../../src/hooks/api/useDocumentation';
import { apiClient } from '../../../src/services/ApiClient';
import { createWrapper, testSetup } from './test-utils';

// Mock the ApiClient service
vi.mock('../../../src/services/ApiClient', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

// ============================================================================
// MOCK DATA FACTORIES
// ============================================================================

const createMockDocumentation = (overrides?: any) => ({
  id: 'doc-123',
  title: 'Test Documentation',
  description: 'A test documentation entry',
  content: '# Test Documentation\n\nThis is test content.',
  type: 'guide',
  status: 'published',
  team_id: 'team-456',
  author_id: 'user-789',
  tags: ['testing', 'documentation'],
  created_at: '2025-01-01T10:00:00Z',
  updated_at: '2025-01-01T10:30:00Z',
  ...overrides,
});

const createMockCreateDocumentationRequest = (overrides?: any) => ({
  title: 'New Documentation',
  description: 'A new documentation entry',
  content: '# New Documentation\n\nContent here.',
  type: 'guide',
  team_id: 'team-456',
  tags: ['new', 'guide'],
  ...overrides,
});

const createMockUpdateDocumentationRequest = (overrides?: any) => ({
  title: 'Updated Documentation',
  description: 'Updated description',
  content: '# Updated Documentation\n\nUpdated content.',
  tags: ['updated', 'guide'],
  ...overrides,
});

// ============================================================================
// documentationKeys TESTS
// ============================================================================

describe('documentationKeys', () => {
  it('should generate correct query keys', () => {
    expect(documentationKeys.all).toEqual(['documentations']);
    expect(documentationKeys.byTeam('team-123')).toEqual(['documentations', 'team', 'team-123']);
    expect(documentationKeys.byId('doc-456')).toEqual(['documentations', 'doc-456']);
  });
});

// ============================================================================
// useTeamDocumentations TESTS
// ============================================================================

describe('useTeamDocumentations', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch team documentations successfully', async () => {
    const teamId = 'team-123';
    const mockDocs = [
      createMockDocumentation(),
      createMockDocumentation({
        id: 'doc-456',
        title: 'Another Doc',
        team_id: teamId,
      }),
    ];

    vi.mocked(apiClient.get).mockResolvedValue(mockDocs);

    const { result } = renderHook(() => useTeamDocumentations(teamId), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDocs);
    expect(apiClient.get).toHaveBeenCalledWith(`/teams/${teamId}/documentations`);
  });

  it('should not fetch when teamId is empty', async () => {
    const { result } = renderHook(() => useTeamDocumentations(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const teamId = 'team-123';
    const error = new Error('Failed to fetch team documentations');

    vi.mocked(apiClient.get).mockRejectedValue(error);

    const { result } = renderHook(() => useTeamDocumentations(teamId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle empty documentations array', async () => {
    const teamId = 'team-123';
    const mockDocs: any[] = [];

    vi.mocked(apiClient.get).mockResolvedValue(mockDocs);

    const { result } = renderHook(() => useTeamDocumentations(teamId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual([]);
  });
});

// ============================================================================
// useDocumentation TESTS
// ============================================================================

describe('useDocumentation', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should fetch documentation by ID successfully', async () => {
    const id = 'doc-123';
    const mockDoc = createMockDocumentation({ id });

    vi.mocked(apiClient.get).mockResolvedValue(mockDoc);

    const { result } = renderHook(() => useDocumentation(id), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockDoc);
    expect(apiClient.get).toHaveBeenCalledWith(`/documentations/${id}`);
  });

  it('should not fetch when id is empty', async () => {
    const { result } = renderHook(() => useDocumentation(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it('should handle API errors', async () => {
    const id = 'doc-123';
    const error = new Error('Documentation not found');

    vi.mocked(apiClient.get).mockRejectedValue(error);

    const { result } = renderHook(() => useDocumentation(id), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

});

// ============================================================================
// useCreateDocumentation TESTS
// ============================================================================

describe('useCreateDocumentation', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should create documentation successfully', async () => {
    const requestData = createMockCreateDocumentationRequest();
    const mockResponse = createMockDocumentation({
      ...requestData,
      id: 'doc-new-123',
    });

    vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useCreateDocumentation(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isIdle).toBe(true);

    result.current.mutate(requestData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(apiClient.post).toHaveBeenCalledWith('/documentations', requestData);
  });

  it('should handle creation errors', async () => {
    const requestData = createMockCreateDocumentationRequest();
    const error = new Error('Failed to create documentation');

    vi.mocked(apiClient.post).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateDocumentation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate(requestData);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should invalidate team documentations query on success', async () => {
    const requestData = createMockCreateDocumentationRequest();
    const mockResponse = createMockDocumentation({
      ...requestData,
      id: 'doc-new-123',
    });

    vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

    // First, set up team documentations query
    const teamDocs = [createMockDocumentation()];
    vi.mocked(apiClient.get).mockResolvedValue(teamDocs);

    const wrapper = createWrapper();

    // Render team documentations hook first to populate cache
    const { result: teamResult } = renderHook(
      () => useTeamDocumentations(requestData.team_id),
      { wrapper }
    );

    await waitFor(() => expect(teamResult.current.isSuccess).toBe(true));

    // Now render the mutation hook
    const { result: mutationResult } = renderHook(() => useCreateDocumentation(), {
      wrapper,
    });

    // Execute mutation
    mutationResult.current.mutate(requestData);

    await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true));

    expect(mutationResult.current.data).toEqual(mockResponse);
  });

});

// ============================================================================
// useUpdateDocumentation TESTS
// ============================================================================

describe('useUpdateDocumentation', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should update documentation successfully', async () => {
    const id = 'doc-123';
    const requestData = createMockUpdateDocumentationRequest();
    const mockResponse = createMockDocumentation({
      id,
      ...requestData,
      updated_at: '2025-01-01T11:00:00Z',
    });

    vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateDocumentation(id), {
      wrapper: createWrapper(),
    });

    expect(result.current.isIdle).toBe(true);

    result.current.mutate(requestData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(mockResponse);
    expect(apiClient.patch).toHaveBeenCalledWith(`/documentations/${id}`, requestData);
  });

  it('should handle update errors', async () => {
    const id = 'doc-123';
    const requestData = createMockUpdateDocumentationRequest();
    const error = new Error('Documentation not found');

    vi.mocked(apiClient.patch).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateDocumentation(id), {
      wrapper: createWrapper(),
    });

    result.current.mutate(requestData);

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should invalidate both specific and team queries on success', async () => {
    const id = 'doc-123';
    const teamId = 'team-456';
    const requestData = createMockUpdateDocumentationRequest();
    const mockResponse = createMockDocumentation({
      id,
      team_id: teamId,
      ...requestData,
    });

    vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

    // Set up existing queries
    const mockDoc = createMockDocumentation({ id, team_id: teamId });
    const teamDocs = [mockDoc];
    vi.mocked(apiClient.get).mockResolvedValue(mockDoc);

    const wrapper = createWrapper();

    // Render both hooks to populate cache
    const { result: docResult } = renderHook(() => useDocumentation(id), { wrapper });
    const { result: teamResult } = renderHook(() => useTeamDocumentations(teamId), { wrapper });

    await waitFor(() => {
      expect(docResult.current.isSuccess).toBe(true);
      expect(teamResult.current.isSuccess).toBe(true);
    });

    // Now render the mutation hook
    const { result: mutationResult } = renderHook(() => useUpdateDocumentation(id), {
      wrapper,
    });

    // Execute mutation
    mutationResult.current.mutate(requestData);

    await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true));

    expect(mutationResult.current.data).toEqual(mockResponse);
  });

  it('should handle partial updates', async () => {
    const id = 'doc-123';
    const requestData = {
      title: 'Updated Title Only',
    };
    const mockResponse = createMockDocumentation({
      id,
      title: requestData.title,
    });

    vi.mocked(apiClient.patch).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateDocumentation(id), {
      wrapper: createWrapper(),
    });

    result.current.mutate(requestData);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.title).toBe(requestData.title);
    expect(apiClient.patch).toHaveBeenCalledWith(`/documentations/${id}`, requestData);
  });
});

// ============================================================================
// useDeleteDocumentation TESTS
// ============================================================================

describe('useDeleteDocumentation', () => {
  beforeEach(testSetup.beforeEach);
  afterEach(testSetup.afterEach);

  it('should delete documentation successfully', async () => {
    const id = 'doc-123';
    const teamId = 'team-456';

    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteDocumentation(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isIdle).toBe(true);

    result.current.mutate({ id, teamId });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual({ id, teamId });
    expect(apiClient.delete).toHaveBeenCalledWith(`/documentations/${id}`);
  });

  it('should handle deletion errors', async () => {
    const id = 'doc-123';
    const teamId = 'team-456';
    const error = new Error('Documentation not found');

    vi.mocked(apiClient.delete).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteDocumentation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id, teamId });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeUndefined();
  });

  it('should invalidate team documentations query on success', async () => {
    const id = 'doc-123';
    const teamId = 'team-456';

    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    // Set up team documentations query
    const teamDocs = [createMockDocumentation({ id, team_id: teamId })];
    vi.mocked(apiClient.get).mockResolvedValue(teamDocs);

    const wrapper = createWrapper();

    // Render team documentations hook first to populate cache
    const { result: teamResult } = renderHook(() => useTeamDocumentations(teamId), {
      wrapper,
    });

    await waitFor(() => expect(teamResult.current.isSuccess).toBe(true));

    // Now render the mutation hook
    const { result: mutationResult } = renderHook(() => useDeleteDocumentation(), {
      wrapper,
    });

    // Execute mutation
    mutationResult.current.mutate({ id, teamId });

    await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true));

    expect(mutationResult.current.data).toEqual({ id, teamId });
  });

  it('should handle permission errors', async () => {
    const id = 'doc-123';
    const teamId = 'team-456';
    const error = new Error('Insufficient permissions');

    vi.mocked(apiClient.delete).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteDocumentation(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({ id, teamId });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toEqual(error);
  });

  it('should reset mutation state correctly', async () => {
    const id = 'doc-123';
    const teamId = 'team-456';

    vi.mocked(apiClient.delete).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteDocumentation(), {
      wrapper: createWrapper(),
    });

    // Initial state
    expect(result.current.isIdle).toBe(true);

    // Execute mutation
    result.current.mutate({ id, teamId });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Reset mutation
    result.current.reset();

    // Wait for reset to take effect
    await waitFor(() => expect(result.current.isIdle).toBe(true));
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeNull();
  });
});
