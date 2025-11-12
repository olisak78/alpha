import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Import all mutation hooks to test
import {
  useCreateMember,
  useUpdateUser,
  useDeleteMember,
} from '../../src/hooks/api/mutations/useMemberMutations';

import {
  useCreateTeam,
  useUpdateTeam,
  useDeleteTeam,
  useAddTeamLink,
  useUpdateTeamLinks,
} from '../../src/hooks/api/mutations/useTeamMutations';

import {
  useCreateQuickLink,
  useDeleteQuickLink,
} from '../../src/hooks/api/mutations/useQuickLinkMutations';

// Mock the API client
import { apiClient } from '../../src/services/ApiClient';
vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
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
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Suppress console errors/warnings during tests for cleaner output
 * React Query may log errors that are intentionally tested
 */
function suppressConsole() {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  
  return () => {
    consoleError.mockRestore();
    consoleWarn.mockRestore();
  };
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

const createMockMember = (overrides?: any) => ({
  id: 'member-123',
  organization_id: 'org-123',
  team_id: 'team-123',
  name: 'John Doe',
  email: 'john@example.com',
  role: 'Developer',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createMockTeam = (overrides?: any) => ({
  id: 'team-123',
  organization_id: 'org-123',
  name: 'Test Team',
  display_name: 'Test Team',
  description: 'A test team',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  ...overrides,
});

const createMockQuickLink = (overrides?: any) => ({
  url: 'https://example.com',
  title: 'Example Link',
  category: 'Development',
  ...overrides,
});

// ============================================================================
// MEMBER MUTATION HOOKS TESTS
// ============================================================================

describe('Member Mutation Hooks', () => {
  let restoreConsole: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restoreConsole = suppressConsole();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreConsole();
  });

  describe('useCreateMember', () => {
    it('should create a new member successfully', async () => {
      const newMemberData = {
        organization_id: 'org-123',
        team_id: 'team-123',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        iuser: 'jdoe',
      };

      const mockResponse = createMockMember(newMemberData);
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateMember(), {
        wrapper: createWrapper(),
      });

      // Trigger mutation
      result.current.mutate(newMemberData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/users', newMemberData);
    });

    it('should call onSuccess callback when mutation succeeds', async () => {
      const onSuccessMock = vi.fn();
      const newMemberData = {
        organization_id: 'org-123',
        team_id: 'team-123',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        iuser: 'jdoe',
      };

      vi.mocked(apiClient.post).mockResolvedValue(createMockMember());

      const { result } = renderHook(
        () => useCreateMember({ onSuccess: onSuccessMock }),
        { wrapper: createWrapper() }
      );

      result.current.mutate(newMemberData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccessMock).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to create member');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateMember(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        organization_id: 'org-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        iuser: 'tuser',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should invalidate members query cache on success', async () => {
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      vi.mocked(apiClient.post).mockResolvedValue(createMockMember());

      const { result } = renderHook(() => useCreateMember(), { wrapper });

      result.current.mutate({
        organization_id: 'org-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        full_name: 'Test User',
        iuser: 'tuser',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useUpdateUser', () => {
    it('should update an existing user successfully', async () => {
      const updateData = {
        id: 'member-123',
        email: 'newemail@example.com',
        first_name: 'John',
        last_name: 'Doe',
        mobile: '+1234567890',
        team_id: 'team-123',
      };

      const mockResponse = createMockMember(updateData);

      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/users', updateData);
    });

    it('should call onSuccess callback when mutation succeeds', async () => {
      const onSuccessMock = vi.fn();
      const updateData = {
        id: 'member-123',
        email: 'updated@example.com',
        first_name: 'John',
        last_name: 'Doe',
        mobile: '+1234567890',
        team_id: 'team-123',
      };

      vi.mocked(apiClient.post).mockResolvedValue(createMockMember(updateData));

      const { result } = renderHook(
        () => useUpdateUser({ onSuccess: onSuccessMock }),
        { wrapper: createWrapper() }
      );

      result.current.mutate(updateData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccessMock).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      const error = new Error('Failed to update user');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: 'member-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        mobile: '+1234567890',
        team_id: 'team-123',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should invalidate user queries on success', async () => {
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      vi.mocked(apiClient.post).mockResolvedValue(createMockMember());

      const { result } = renderHook(() => useUpdateUser(), { wrapper });

      result.current.mutate({
        id: 'member-123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        mobile: '+1234567890',
        team_id: 'team-123',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useDeleteMember', () => {
    it('should delete a member successfully', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteMember(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('member-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith('/members/member-123');
    });

    it('should call onSuccess callback', async () => {
      const onSuccessMock = vi.fn();
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { result } = renderHook(
        () => useDeleteMember({ onSuccess: onSuccessMock }),
        { wrapper: createWrapper() }
      );

      result.current.mutate('member-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccessMock).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      const error = new Error('Failed to delete member');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteMember(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('member-123');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should remove member from cache on success', async () => {
      const queryClient = createTestQueryClient();
      const removeQueriesSpy = vi.spyOn(queryClient, 'removeQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteMember(), { wrapper });

      result.current.mutate('member-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(removeQueriesSpy).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// TEAM MUTATION HOOKS TESTS
// ============================================================================

describe('Team Mutation Hooks', () => {
  let restoreConsole: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restoreConsole = suppressConsole();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreConsole();
  });

  describe('useCreateTeam', () => {
    it('should create a new team successfully', async () => {
      const newTeamData = {
        organization_id: 'org-123',
        name: 'New Team',
        display_name: 'New Team',
        description: 'A new team',
      };

      const mockResponse = createMockTeam(newTeamData);
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateTeam(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(newTeamData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith('/teams', newTeamData);
    });

    it('should call onSuccess callback', async () => {
      const onSuccessMock = vi.fn();
      const newTeamData = {
        organization_id: 'org-123',
        name: 'New Team',
        display_name: 'New Team',
      };

      vi.mocked(apiClient.post).mockResolvedValue(createMockTeam());

      const { result } = renderHook(
        () => useCreateTeam({ onSuccess: onSuccessMock }),
        { wrapper: createWrapper() }
      );

      result.current.mutate(newTeamData);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccessMock).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to create team');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateTeam(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        organization_id: 'org-123',
        name: 'New Team',
        display_name: 'New Team',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should invalidate teams cache on success', async () => {
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      vi.mocked(apiClient.post).mockResolvedValue(createMockTeam());

      const { result } = renderHook(() => useCreateTeam(), { wrapper });

      result.current.mutate({
        organization_id: 'org-123',
        name: 'New Team',
        display_name: 'New Team',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useUpdateTeam', () => {
    it('should update an existing team successfully', async () => {
      const updateData = {
        display_name: 'Updated Team Name',
        description: 'Updated description',
      };

      const mockResponse = createMockTeam({
        id: 'team-123',
        ...updateData,
      });

      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateTeam(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: 'team-123',
        data: updateData,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(apiClient.put).toHaveBeenCalledWith('/teams/team-123', updateData);
    });

    it('should invalidate cache when mutation succeeds', async () => {
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      const updateData = { display_name: 'Updated' };
      vi.mocked(apiClient.put).mockResolvedValue(createMockTeam(updateData));

      const { result } = renderHook(() => useUpdateTeam(), { wrapper });

      result.current.mutate({
        id: 'team-123',
        data: updateData,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify cache was invalidated (which is what the hook actually does)
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      const error = new Error('Failed to update team');
      vi.mocked(apiClient.put).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateTeam(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        id: 'team-123',
        data: { display_name: 'Updated' },
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should invalidate team queries on success', async () => {
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      vi.mocked(apiClient.put).mockResolvedValue(createMockTeam());

      const { result } = renderHook(() => useUpdateTeam(), { wrapper });

      result.current.mutate({
        id: 'team-123',
        data: { display_name: 'Updated' },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(invalidateSpy).toHaveBeenCalled();
    });
  });

  describe('useDeleteTeam', () => {
    it('should delete a team successfully', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteTeam(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('team-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith('/teams/team-123');
    });

    it('should remove from cache when mutation succeeds', async () => {
      const queryClient = createTestQueryClient();
      const removeQueriesSpy = vi.spyOn(queryClient, 'removeQueries');
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteTeam(), { wrapper });

      result.current.mutate('team-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Verify cache operations were performed (which is what the hook actually does)
      expect(removeQueriesSpy).toHaveBeenCalled();
      expect(invalidateSpy).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      const error = new Error('Failed to delete team');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteTeam(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('team-123');

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should remove team from cache on success', async () => {
      const queryClient = createTestQueryClient();
      const removeQueriesSpy = vi.spyOn(queryClient, 'removeQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteTeam(), { wrapper });

      result.current.mutate('team-123');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(removeQueriesSpy).toHaveBeenCalled();
    });
  });

  describe('useAddTeamLink', () => {
    it('should add a link to a team successfully', async () => {
      const linkData = {
        name: 'API Docs',
        description: 'Documentation for the API',
        owner: 'team-123',
        url: 'https://docs.example.com',
        category_id: 'documentation',
        tags: 'api,docs',
      };

      const mockResponse = { success: true };
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddTeamLink(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        teamId: 'team-123',
        data: linkData,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.post).toHaveBeenCalledWith('/links', linkData);
    });

    it('should call onSuccess callback', async () => {
      const onSuccessMock = vi.fn();
      vi.mocked(apiClient.post).mockResolvedValue({ success: true });

      const { result } = renderHook(
        () => useAddTeamLink({ onSuccess: onSuccessMock }),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        teamId: 'team-123',
        data: {
          name: 'Test Link',
          description: 'A test link',
          owner: 'team-123',
          url: 'https://test.com',
          category_id: 'test',
          tags: 'test',
        },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccessMock).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to add link');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const { result } = renderHook(() => useAddTeamLink(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        teamId: 'team-123',
        data: {
          name: 'Test Link',
          description: 'A test link',
          owner: 'team-123',
          url: 'https://test.com',
          category_id: 'test',
          tags: 'test',
        },
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });


  describe('useUpdateTeamLinks', () => {
    it('should update team links successfully', async () => {
      const linksData = {
        links: [
          {
            category: 'Documentation',
            icon: '',
            title: 'API Docs',
            url: 'https://docs.example.com',
          },
          {
            category: 'Development',
            icon: '',
            title: 'GitHub',
            url: 'https://github.com',
          },
        ],
      };

      const mockResponse = { success: true };
      vi.mocked(apiClient.put).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpdateTeamLinks(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        teamId: 'team-123',
        data: linksData,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.put).toHaveBeenCalledWith('/teams/team-123/links', linksData);
    });

    it('should call onSuccess callback', async () => {
      const onSuccessMock = vi.fn();
      vi.mocked(apiClient.put).mockResolvedValue({ success: true });

      const { result } = renderHook(
        () => useUpdateTeamLinks({ onSuccess: onSuccessMock }),
        { wrapper: createWrapper() }
      );

      result.current.mutate({
        teamId: 'team-123',
        data: { links: [] },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccessMock).toHaveBeenCalled();
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to update links');
      vi.mocked(apiClient.put).mockRejectedValue(error);

      const { result } = renderHook(() => useUpdateTeamLinks(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        teamId: 'team-123',
        data: { links: [] },
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should handle empty links array', async () => {
      vi.mocked(apiClient.put).mockResolvedValue({ success: true });

      const { result } = renderHook(() => useUpdateTeamLinks(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        teamId: 'team-123',
        data: { links: [] },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.put).toHaveBeenCalledWith('/teams/team-123/links', { links: [] });
    });
  });
});

// ============================================================================
// QUICK LINK MUTATION HOOKS TESTS
// ============================================================================

describe('Quick Link Mutation Hooks', () => {
  let restoreConsole: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restoreConsole = suppressConsole();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreConsole();
  });

  describe('useCreateQuickLink', () => {
    it('should create a quick link successfully', async () => {
      const newLinkData = {
        url: 'https://example.com',
        title: 'Example Site',
        category: 'Favorites',
      };

      const mockResponse = createMockQuickLink(newLinkData);
      vi.mocked(apiClient.post).mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateQuickLink(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        memberId: 'member-123',
        data: newLinkData,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockResponse);
      expect(apiClient.post).toHaveBeenCalledWith(
        '/members/member-123/quick-links',
        newLinkData
      );
    });

    it('should call onSuccess callback and refetch queries', async () => {
      const onSuccessMock = vi.fn();
      const queryClient = createTestQueryClient();
      const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      vi.mocked(apiClient.post).mockResolvedValue(createMockQuickLink());

      const { result } = renderHook(
        () => useCreateQuickLink({ onSuccess: onSuccessMock }),
        { wrapper }
      );

      result.current.mutate({
        memberId: 'member-123',
        data: {
          url: 'https://example.com',
          title: 'Test',
          category: 'Test',
        },
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccessMock).toHaveBeenCalled();
      expect(refetchSpy).toHaveBeenCalled();
    });

    it('should handle API errors', async () => {
      const error = new Error('Failed to create quick link');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateQuickLink(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        memberId: 'member-123',
        data: {
          url: 'https://example.com',
          title: 'Test',
          category: 'Test',
        },
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should handle duplicate quick link errors', async () => {
      const error = new Error('Quick link already exists');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateQuickLink(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        memberId: 'member-123',
        data: {
          url: 'https://example.com',
          title: 'Duplicate',
          category: 'Test',
        },
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should validate URL format via API', async () => {
      const invalidUrlData = {
        url: 'not-a-valid-url',
        title: 'Invalid',
        category: 'Test',
      };

      const error = new Error('Invalid URL format');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const { result } = renderHook(() => useCreateQuickLink(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        memberId: 'member-123',
        data: invalidUrlData,
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });

  describe('useDeleteQuickLink', () => {
    it('should delete a quick link successfully', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteQuickLink(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        memberId: 'member-123',
        url: 'https://example.com',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith(
        '/members/member-123/quick-links?url=https%3A%2F%2Fexample.com'
      );
    });

    it('should handle URL encoding properly', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteQuickLink(), {
        wrapper: createWrapper(),
      });

      const urlWithParams = 'https://example.com/path?query=value&other=data';
      result.current.mutate({
        memberId: 'member-123',
        url: urlWithParams,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(apiClient.delete).toHaveBeenCalledWith(
        expect.stringContaining('/members/member-123/quick-links?url=')
      );
    });

    it('should call onSuccess callback and refetch queries', async () => {
      const onSuccessMock = vi.fn();
      const queryClient = createTestQueryClient();
      const refetchSpy = vi.spyOn(queryClient, 'refetchQueries');

      const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );

      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { result } = renderHook(
        () => useDeleteQuickLink({ onSuccess: onSuccessMock }),
        { wrapper }
      );

      result.current.mutate({
        memberId: 'member-123',
        url: 'https://example.com',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(onSuccessMock).toHaveBeenCalled();
      expect(refetchSpy).toHaveBeenCalled();
    });

    it('should handle delete errors', async () => {
      const error = new Error('Failed to delete quick link');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteQuickLink(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        memberId: 'member-123',
        url: 'https://example.com',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });

    it('should handle non-existent quick link errors', async () => {
      const error = new Error('Quick link not found');
      vi.mocked(apiClient.delete).mockRejectedValue(error);

      const { result } = renderHook(() => useDeleteQuickLink(), {
        wrapper: createWrapper(),
      });

      result.current.mutate({
        memberId: 'member-123',
        url: 'https://non-existent.com',
      });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toEqual(error);
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('Mutation Hooks Integration Tests', () => {
  let restoreConsole: () => void;

  beforeEach(() => {
    vi.clearAllMocks();
    restoreConsole = suppressConsole();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    restoreConsole();
  });

  describe('Member CRUD flow', () => {
    it('should create, update, and delete a member in sequence', async () => {
      // Create
      const createData = {
        organization_id: 'org-123',
        team_id: 'team-123',
        email: 'john@example.com',
        first_name: 'John',
        last_name: 'Doe',
        full_name: 'John Doe',
        iuser: 'jdoe',
      };
      const createdMember = createMockMember({ id: 'member-new', ...createData });
      vi.mocked(apiClient.post).mockResolvedValue(createdMember);

      const { result: createResult } = renderHook(() => useCreateMember(), {
        wrapper: createWrapper(),
      });

      createResult.current.mutate(createData);
      await waitFor(() => expect(createResult.current.isSuccess).toBe(true));
      expect(createResult.current.data?.id).toBe('member-new');

      // Update
      const updateData = {
        id: 'member-new',
        email: 'john.updated@example.com',
        first_name: 'John',
        last_name: 'Doe',
        mobile: '+1234567890',
        team_id: 'team-123',
      };
      const updatedMember = createMockMember(updateData);
      vi.mocked(apiClient.post).mockResolvedValue(updatedMember);

      const { result: updateResult } = renderHook(() => useUpdateUser(), {
        wrapper: createWrapper(),
      });

      updateResult.current.mutate(updateData);
      await waitFor(() => expect(updateResult.current.isSuccess).toBe(true));
      expect(updateResult.current.data?.email).toBe('john.updated@example.com');

      // Delete
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { result: deleteResult } = renderHook(() => useDeleteMember(), {
        wrapper: createWrapper(),
      });

      deleteResult.current.mutate('member-new');
      await waitFor(() => expect(deleteResult.current.isSuccess).toBe(true));
    });
  });

  describe('Team with links flow', () => {
    it('should create a team and add links to it', async () => {
      // Create team
      const teamData = {
        organization_id: 'org-123',
        name: 'New Team',
        display_name: 'New Team',
      };
      const createdTeam = createMockTeam({ id: 'team-new', ...teamData });
      vi.mocked(apiClient.post).mockResolvedValue(createdTeam);

      const { result: createTeamResult } = renderHook(() => useCreateTeam(), {
        wrapper: createWrapper(),
      });

      createTeamResult.current.mutate(teamData);
      await waitFor(() => expect(createTeamResult.current.isSuccess).toBe(true));

      // Add link to team
      const linkData = {
        name: 'Team Docs',
        description: 'Documentation for the team',
        owner: 'team-new',
        url: 'https://docs.team.com',
        category_id: 'documentation',
        tags: 'docs,team',
      };
      vi.mocked(apiClient.post).mockResolvedValue({ success: true });

      const { result: addLinkResult } = renderHook(() => useAddTeamLink(), {
        wrapper: createWrapper(),
      });

      addLinkResult.current.mutate({ teamId: 'team-new', data: linkData });
      await waitFor(() => expect(addLinkResult.current.isSuccess).toBe(true));
    });
  });

  describe('Quick links management flow', () => {
    it('should create and delete quick links', async () => {
      // Create quick link
      const linkData = {
        url: 'https://example.com',
        title: 'Example',
        category: 'Work',
      };
      vi.mocked(apiClient.post).mockResolvedValue(createMockQuickLink(linkData));

      const { result: createResult } = renderHook(() => useCreateQuickLink(), {
        wrapper: createWrapper(),
      });

      createResult.current.mutate({ memberId: 'member-123', data: linkData });
      await waitFor(() => expect(createResult.current.isSuccess).toBe(true));

      // Delete quick link
      vi.mocked(apiClient.delete).mockResolvedValue(undefined);

      const { result: deleteResult } = renderHook(() => useDeleteQuickLink(), {
        wrapper: createWrapper(),
      });

      deleteResult.current.mutate({ memberId: 'member-123', url: linkData.url });
      await waitFor(() => expect(deleteResult.current.isSuccess).toBe(true));
    });
  });
});
