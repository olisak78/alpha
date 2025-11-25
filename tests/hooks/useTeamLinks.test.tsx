import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Import the hook to test
import { useTeamLinks } from '../../src/hooks/team/useTeamLinks';

// Import types
import type { TeamLink, LinkFormData } from '../../src/components/Team/types';
import type { ApiCategory, UserMeResponse } from '../../src/types/api';

// Mock dependencies
import { apiClient } from '../../src/services/ApiClient';

vi.mock('../../src/services/ApiClient', () => ({
  apiClient: {
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    get: vi.fn(),
  },
}));

// Mock all the hooks used by useTeamLinks
vi.mock('../../src/hooks/api/mutations/useTeamMutations', () => ({
  useUpdateTeamLinks: vi.fn(),
}));

vi.mock('../../src/hooks/api/mutations/useLinksMutations', () => ({
  useDeleteLink: vi.fn(),
}));

vi.mock('../../src/hooks/api/useTeams', () => ({
  useTeamById: vi.fn(),
}));

vi.mock('../../src/hooks/api/useLinks', () => ({
  useCategories: vi.fn(),
}));

vi.mock('../../src/hooks/api/useMembers', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('../../src/hooks/api/mutations/useFavoriteMutations', () => ({
  useAddFavorite: vi.fn(),
  useRemoveFavorite: vi.fn(),
}));

vi.mock('../../src/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('../../src/constants/developer-portal', () => ({
  defaultLinkForm: {
    title: '',
    url: '',
    existingCategory: ''
  }
}));

// Import mocked modules
import { useUpdateTeamLinks } from '../../src/hooks/api/mutations/useTeamMutations';
import { useDeleteLink } from '../../src/hooks/api/mutations/useLinksMutations';
import { useTeamById } from '../../src/hooks/api/useTeams';
import { useCategories } from '../../src/hooks/api/useLinks';
import { useCurrentUser } from '../../src/hooks/api/useMembers';
import { useAddFavorite, useRemoveFavorite } from '../../src/hooks/api/mutations/useFavoriteMutations';
import { useToast } from '../../src/hooks/use-toast';

// Cast to mock functions
const mockUseUpdateTeamLinks = useUpdateTeamLinks as ReturnType<typeof vi.fn>;
const mockUseDeleteLink = useDeleteLink as ReturnType<typeof vi.fn>;
const mockUseTeamById = useTeamById as ReturnType<typeof vi.fn>;
const mockUseCategories = useCategories as ReturnType<typeof vi.fn>;
const mockUseCurrentUser = useCurrentUser as ReturnType<typeof vi.fn>;
const mockUseAddFavorite = useAddFavorite as ReturnType<typeof vi.fn>;
const mockUseRemoveFavorite = useRemoveFavorite as ReturnType<typeof vi.fn>;
const mockUseToast = useToast as ReturnType<typeof vi.fn>;

// ============================================================================
// TEST UTILITIES
// ============================================================================

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

function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Mock data factories
const createMockTeamLink = (overrides?: Partial<TeamLink>): TeamLink => ({
  id: 'link-123',
  name: 'Test Link',
  url: 'https://example.com',
  category_id: 'cat-1',
  description: 'A test link',
  owner: 'team-123',
  tags: 'test,example',
  favorite: false,
  ...overrides,
});

const createMockCategory = (overrides?: Partial<ApiCategory>): ApiCategory => ({
  id: 'cat-1',
  name: 'test-category',
  title: 'Test Category',
  description: 'A test category',
  icon: 'Code',
  color: 'bg-blue-500',
  ...overrides,
});

const createMockUserMeResponse = (overrides?: Partial<UserMeResponse>): UserMeResponse => ({
  id: 'user-123',
  uuid: 'uuid-123',
  team_id: 'team-123',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  mobile: '123456789',
  team_domain: 'example',
  team_role: 'developer',
  link: [],
  ...overrides,
});

const createMockTeamData = (overrides?: any) => ({
  id: 'team-123',
  name: 'Test Team',
  links: [
    {
      id: 'link-1',
      name: 'API Docs',
      url: 'https://docs.example.com',
      category_id: 'cat-1',
      description: 'API Documentation',
      tags: ['docs', 'api'],
      favorite: false,
    },
  ],
  ...overrides,
});

const setupDefaultMocks = () => {
  const mockToast = vi.fn();
  const mockUpdateTeamLinksMutate = vi.fn();
  const mockDeleteLinkMutate = vi.fn();
  const mockAddFavoriteMutate = vi.fn();
  const mockRemoveFavoriteMutate = vi.fn();
  const mockRefetchTeam = vi.fn();

  mockUseToast.mockReturnValue({ toast: mockToast });
  
  mockUseUpdateTeamLinks.mockReturnValue({
    mutate: mockUpdateTeamLinksMutate,
    isPending: false,
    error: null,
  });

  mockUseDeleteLink.mockReturnValue({
    mutate: mockDeleteLinkMutate,
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    error: null,
  });

  mockUseTeamById.mockReturnValue({
    data: createMockTeamData(),
    refetch: mockRefetchTeam,
    isLoading: false,
    error: null,
  });

  mockUseCategories.mockReturnValue({
    data: {
      categories: [createMockCategory()],
      total: 1,
      page: 1,
      page_size: 10,
    },
    isLoading: false,
    error: null,
  });

  mockUseCurrentUser.mockReturnValue({
    data: createMockUserMeResponse(),
    isLoading: false,
    error: null,
  });

  mockUseAddFavorite.mockReturnValue({
    mutate: mockAddFavoriteMutate,
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    error: null,
  });

  mockUseRemoveFavorite.mockReturnValue({
    mutate: mockRemoveFavoriteMutate,
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
    error: null,
  });

  return {
    mockToast,
    mockUpdateTeamLinksMutate,
    mockDeleteLinkMutate,
    mockAddFavoriteMutate,
    mockRemoveFavoriteMutate,
    mockRefetchTeam,
  };
};

// ============================================================================
// TESTS
// ============================================================================

describe('useTeamLinks Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      expect(result.current.linkDialogOpen).toBe(false);
      expect(result.current.editingLink).toBe(null);
      expect(result.current.isAddingLink).toBe(false);
      expect(result.current.linkForm).toEqual({
        title: '',
        url: '',
        existingCategory: ''
      });
    });

    it('should initialize with initial links when no team data exists', () => {
      const initialLinks = [createMockTeamLink({ id: 'initial-1' })];
      
      // Mock team data as undefined/null so initial links are used
      mockUseTeamById.mockReturnValue({
        data: { id: 'team-123', name: 'Test Team', links: undefined },
        refetch: vi.fn(),
        isLoading: false,
        error: null,
      });
      
      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123', initialLinks }),
        { wrapper: createWrapper() }
      );

      expect(result.current.links).toHaveLength(1);
      expect(result.current.links[0].id).toBe('initial-1');
    });

    it('should respect empty array from server over initial links', () => {
      const initialLinks = [createMockTeamLink({ id: 'initial-1' })];
      
      // Mock team data with empty array (server says "no links")
      mockUseTeamById.mockReturnValue({
        data: { id: 'team-123', name: 'Test Team', links: [] },
        refetch: vi.fn(),
        isLoading: false,
        error: null,
      });
      
      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123', initialLinks }),
        { wrapper: createWrapper() }
      );

      // Should respect server's empty array, not use initial links
      expect(result.current.links).toHaveLength(0);
    });

    it('should prioritize team data over initial links', () => {
      const initialLinks = [createMockTeamLink({ id: 'initial-1' })];
      
      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123', initialLinks }),
        { wrapper: createWrapper() }
      );

      // Should use team data from mock, not initial links
      expect(result.current.links).toHaveLength(1);
      expect(result.current.links[0].id).toBe('link-1');
    });
  });

  describe('Dialog Management', () => {
    it('should manage dialog state and form reset', () => {
      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      // Test opening dialog
      act(() => {
        result.current.openAddLinkDialog();
      });
      expect(result.current.linkDialogOpen).toBe(true);
      expect(result.current.editingLink).toBe(null);

      // Set form data
      act(() => {
        result.current.setLinkForm({
          title: 'Test',
          url: 'https://test.com',
          existingCategory: 'cat-1'
        });
      });

      // Test closing dialog and form reset
      act(() => {
        result.current.closeLinkDialog();
      });
      expect(result.current.linkDialogOpen).toBe(false);
      expect(result.current.editingLink).toBe(null);
      expect(result.current.linkForm).toEqual({
        title: '',
        url: '',
        existingCategory: ''
      });

      // Test dialog open change handler - opening
      act(() => {
        result.current.onLinkDialogOpenChange(true);
      });
      expect(result.current.linkDialogOpen).toBe(true);

      // Test dialog open change handler - closing (this triggers closeLinkDialog)
      act(() => {
        result.current.setLinkForm({
          title: 'Test Data',
          url: 'https://test.com',
          existingCategory: 'cat-1'
        });
      });

      act(() => {
        result.current.onLinkDialogOpenChange(false);
      });
      expect(result.current.linkDialogOpen).toBe(false);
      expect(result.current.editingLink).toBe(null);
      expect(result.current.linkForm).toEqual({
        title: '',
        url: '',
        existingCategory: ''
      });
    });
  });

  describe('Link Editing', () => {
    it('should handle link editing and form updates', () => {
      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      const linkToEdit = result.current.links[0];

      // Test opening edit dialog with link data
      act(() => {
        result.current.editLink(linkToEdit);
      });
      expect(result.current.linkDialogOpen).toBe(true);
      expect(result.current.editingLink).toEqual(linkToEdit);
      expect(result.current.linkForm.title).toBe(linkToEdit.name);
      expect(result.current.linkForm.url).toBe(linkToEdit.url);
      expect(result.current.linkForm.existingCategory).toBe(linkToEdit.category_id);

      // Test updating form data
      const newFormData: LinkFormData = {
        title: 'Updated Link',
        url: 'https://updated.com',
        existingCategory: 'cat-2'
      };
      act(() => {
        result.current.setLinkForm(newFormData);
      });
      expect(result.current.linkForm).toEqual(newFormData);
    });
  });

  describe('Adding Links', () => {
    it('should add new link successfully', async () => {
      const { mockToast, mockRefetchTeam } = setupDefaultMocks();
      vi.mocked(apiClient.post).mockResolvedValue({ success: true });
      mockRefetchTeam.mockResolvedValue({
        data: {
          ...createMockTeamData(),
          links: [
            ...createMockTeamData().links,
            {
              id: 'new-link',
              name: 'New Link',
              url: 'https://new.com',
              category_id: 'cat-1',
              description: 'New link description',
              tags: [],
              favorite: false,
            }
          ]
        }
      });

      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      // Set form data
      act(() => {
        result.current.setLinkForm({
          title: 'New Link',
          url: 'https://new.com',
          existingCategory: 'cat-1'
        });
      });

      // Submit form
      act(() => {
        result.current.handleLinkSubmit();
      });

      // Should optimistically add link
      expect(result.current.links).toHaveLength(2);
      expect(result.current.links[1].name).toBe('New Link');

      // Wait for API call to complete
      await waitFor(() => {
        expect(apiClient.post).toHaveBeenCalledWith('/links', {
          name: 'New Link',
          description: 'some description',
          owner: 'team-123',
          url: 'https://new.com',
          category_id: 'cat-1',
          tags: ''
        });
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Link added successfully',
          description: 'The team link has been added to your team.',
        });
      });
    });

    it('should handle add link error with rollback', async () => {
      const { mockToast } = setupDefaultMocks();
      const error = new Error('Failed to add link');
      vi.mocked(apiClient.post).mockRejectedValue(error);

      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      const originalLinksCount = result.current.links.length;

      // Set form data
      act(() => {
        result.current.setLinkForm({
          title: 'New Link',
          url: 'https://new.com',
          existingCategory: 'cat-1'
        });
      });

      // Submit form
      act(() => {
        result.current.handleLinkSubmit();
      });

      // Should optimistically add link
      expect(result.current.links).toHaveLength(originalLinksCount + 1);

      // Wait for error and rollback
      await waitFor(() => {
        expect(result.current.links).toHaveLength(originalLinksCount);
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Failed to add link',
          description: 'There was an error adding the link. Please try again.',
        });
      });

      // Dialog should reopen with form data intact
      expect(result.current.linkDialogOpen).toBe(true);
      expect(result.current.linkForm.title).toBe('New Link');
    });

    it('should not submit with incomplete form data', () => {
      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      // Try to submit with incomplete form
      act(() => {
        result.current.setLinkForm({
          title: 'Incomplete',
          url: '',
          existingCategory: ''
        });
      });

      act(() => {
        result.current.handleLinkSubmit();
      });

      // Should not make API call
      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });

  describe('Removing Links', () => {
    it('should remove link successfully', async () => {
      const { mockToast, mockRefetchTeam } = setupDefaultMocks();
      const mockDeleteLinkMutateAsync = vi.fn().mockResolvedValue(undefined);
      
      mockUseDeleteLink.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: mockDeleteLinkMutateAsync,
        isPending: false,
        error: null,
      });

      mockRefetchTeam.mockResolvedValue({
        data: {
          ...createMockTeamData(),
          links: [] // Empty after deletion
        }
      });

      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      const linkToRemove = result.current.links[0];

      await act(async () => {
        await result.current.removeLink(linkToRemove);
      });

      expect(mockDeleteLinkMutateAsync).toHaveBeenCalledWith('link-1');
      expect(mockRefetchTeam).toHaveBeenCalled();
    });

    it('should handle remove link error', async () => {
      const { mockToast } = setupDefaultMocks();
      const error = new Error('Failed to delete');
      const mockDeleteLinkMutateAsync = vi.fn().mockRejectedValue(error);
      
      mockUseDeleteLink.mockReturnValue({
        mutate: vi.fn(),
        mutateAsync: mockDeleteLinkMutateAsync,
        isPending: false,
        error: null,
      });

      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      const linkToRemove = result.current.links[0]; // This has a valid ID 'link-1'

      await act(async () => {
        await result.current.removeLink(linkToRemove);
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Failed to remove link',
          description: 'There was an error removing the link. Please try again.',
        });
      });
    });

    it('should handle removing link without valid ID', async () => {
      const { mockToast } = setupDefaultMocks();
      
      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      const linkWithoutId = { ...result.current.links[0], id: '' };

      await act(async () => {
        await result.current.removeLink(linkWithoutId);
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Failed to remove link',
          description: 'This link doesn\'t have a valid ID.',
        });
      });
    });
  });

  describe('Favorite Management', () => {
    it('should handle favorite toggling with and without user', () => {
      const { mockAddFavoriteMutate, mockToast } = setupDefaultMocks();
      
      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      // Test with authenticated user
      act(() => {
        result.current.toggleFavorite('link-1');
      });
      expect(mockAddFavoriteMutate).toHaveBeenCalledWith(
        { userId: 'user-123', linkId: 'link-1' },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        })
      );

      // Test without user (unauthenticated)
      mockUseCurrentUser.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const { result: resultNoUser } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        resultNoUser.current.toggleFavorite('link-1');
      });
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Authentication required',
        description: 'Please log in to manage favorites.',
      });
    });

    it('should handle favorite toggle success and error callbacks', () => {
      const { mockAddFavoriteMutate, mockToast } = setupDefaultMocks();
      
      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.toggleFavorite('link-1');
      });

      // Get the onSuccess and onError callbacks from the mutation call
      const mutationCall = mockAddFavoriteMutate.mock.calls[0];
      const callbacks = mutationCall[1];

      // Test onSuccess callback
      act(() => {
        callbacks.onSuccess();
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Added to favorites',
        description: 'This link has been added to your favorites.',
      });

      // Test onError callback
      const error = { message: 'Network error' };
      act(() => {
        callbacks.onError(error);
      });
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Failed to add to favorites',
        description: 'Network error',
      });
    });

    it('should handle remove favorite callbacks', () => {
      const { mockRemoveFavoriteMutate, mockToast } = setupDefaultMocks();
      
      // Mock user with existing favorite
      mockUseCurrentUser.mockReturnValue({
        data: {
          ...createMockUserMeResponse(),
          link: [{ id: 'link-1', favorite: true }]
        },
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );

      act(() => {
        result.current.toggleFavorite('link-1');
      });

      // Get the onSuccess and onError callbacks from the mutation call
      const mutationCall = mockRemoveFavoriteMutate.mock.calls[0];
      const callbacks = mutationCall[1];

      // Test onSuccess callback for remove
      act(() => {
        callbacks.onSuccess();
      });
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Removed from favorites',
        description: 'This link has been removed from your favorites.',
      });

      // Test onError callback for remove
      const error = { message: 'Server error' };
      act(() => {
        callbacks.onError(error);
      });
      expect(mockToast).toHaveBeenCalledWith({
        variant: 'destructive',
        title: 'Failed to remove from favorites',
        description: 'Server error',
      });
    });
  });

  describe('Categories', () => {
    it('should handle categories from links and empty data', () => {
      // Test with categories data
      const { result } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );
      expect(result.current.existingCategories).toContain('cat-1');

      // Test with empty categories data
      mockUseCategories.mockReturnValue({
        data: { categories: [] },
        isLoading: false,
        error: null,
      });

      const { result: resultEmpty } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );
      expect(resultEmpty.current.existingCategories).toEqual([]);
    });
  });

  describe('Edge Cases', () => {
    it('should handle various edge cases', () => {
      // Test missing teamId
      const { result: resultNoTeam } = renderHook(
        () => useTeamLinks({}),
        { wrapper: createWrapper() }
      );
      expect(resultNoTeam.current.links).toEqual([]);
      expect(resultNoTeam.current.linkDialogOpen).toBe(false);

      // Test team data without links
      mockUseTeamById.mockReturnValue({
        data: { id: 'team-123', name: 'Test Team' },
        refetch: vi.fn(),
        isLoading: false,
        error: null,
      });

      const { result: resultNoLinks } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );
      expect(resultNoLinks.current.links).toEqual([]);

      // Test API links with different tag formats
      const teamDataWithDifferentTags = {
        ...createMockTeamData(),
        links: [
          {
            id: 'link-1',
            name: 'Link with array tags',
            url: 'https://example1.com',
            category_id: 'cat-1',
            description: 'Test',
            tags: ['tag1', 'tag2'],
            favorite: false,
          },
          {
            id: 'link-2',
            name: 'Link with string tags',
            url: 'https://example2.com',
            category_id: 'cat-1',
            description: 'Test',
            tags: 'tag1,tag2',
            favorite: false,
          },
        ]
      };

      mockUseTeamById.mockReturnValue({
        data: teamDataWithDifferentTags,
        refetch: vi.fn(),
        isLoading: false,
        error: null,
      });

      const { result: resultTags } = renderHook(
        () => useTeamLinks({ teamId: 'team-123' }),
        { wrapper: createWrapper() }
      );
      expect(resultTags.current.links).toHaveLength(2);
      expect(resultTags.current.links[0].tags).toBe('tag1,tag2');
      expect(resultTags.current.links[1].tags).toBe('tag1,tag2');
    });
  });
});
