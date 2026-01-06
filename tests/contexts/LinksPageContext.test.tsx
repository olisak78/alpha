import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { LinksProvider, useLinksPageContext } from '@/contexts/LinksPageContext';
import * as useLinks from '@/hooks/api/useLinks';
import * as useMembers from '@/hooks/api/useMembers';
import * as useFavoriteMutations from '@/hooks/api/mutations/useFavoriteMutations';
import * as useToast from '@/hooks/use-toast';
import * as linksPageStore from '@/stores/linksPageStore';
import React from 'react';

// Mock all dependencies
vi.mock('@/hooks/api/useLinks', () => ({
  useLinks: vi.fn(),
  useCategories: vi.fn(),
}));

vi.mock('@/hooks/api/useMembers', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('@/hooks/api/mutations/useFavoriteMutations', () => ({
  useAddFavorite: vi.fn(),
  useRemoveFavorite: vi.fn(),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

vi.mock('@/stores/linksPageStore', () => ({
  useLinksSearchTerm: vi.fn(),
  useLinksSelectedCategoryId: vi.fn(),
  useLinksViewMode: vi.fn(),
  useLinksSearchFilterActions: vi.fn(),
}));

describe('LinksPageContext', () => {
  const mockToast = vi.fn();
  const mockSetSearchTerm = vi.fn();
  const mockSetSelectedCategoryId = vi.fn();
  const mockSetViewMode = vi.fn();
  const mockAddFavorite = vi.fn();
  const mockRemoveFavorite = vi.fn();

  const mockCurrentUser = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    c_number: 'C123456',
    team_id: 'team-1',
    link: [
      { id: 'link-1', title: 'Favorite Link 1', url: 'https://example.com/1' },
      { id: 'link-2', title: 'Favorite Link 2', url: 'https://example.com/2' },
    ],
  };

  const mockCategories = {
    categories: [
      { id: 'cat-1', title: 'Development', icon: 'Code', color: '#3b82f6' },
      { id: 'cat-2', title: 'Security', icon: 'Shield', color: '#ef4444' },
      { id: 'cat-3', title: 'Unknown Icon', icon: 'UnknownIcon', color: '#000000' },
    ],
  };

  const mockLinks = [
    {
      id: 'link-1',
      title: 'Link 1',
      url: 'https://example.com/1',
      description: 'First link',
      category_id: 'cat-1',
      tags: ['tag1'],
    },
    {
      id: 'link-2',
      title: 'Link 2',
      url: 'https://example.com/2',
      description: 'Second link',
      category_id: 'cat-1',
      tags: ['tag2'],
    },
    {
      id: 'link-3',
      title: 'Link 3',
      url: 'https://example.com/3',
      description: 'Third link',
      category_id: 'cat-2',
      tags: ['tag3'],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(useToast.useToast).mockReturnValue({ toast: mockToast } as any);
    vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('');
    vi.mocked(linksPageStore.useLinksSelectedCategoryId).mockReturnValue('all');
    vi.mocked(linksPageStore.useLinksViewMode).mockReturnValue('card');
    vi.mocked(linksPageStore.useLinksSearchFilterActions).mockReturnValue({
      setSearchTerm: mockSetSearchTerm,
      setSelectedCategoryId: mockSetSelectedCategoryId,
      setViewMode: mockSetViewMode,
    });

    vi.mocked(useMembers.useCurrentUser).mockReturnValue({
      data: mockCurrentUser,
      isLoading: false,
    } as any);

    vi.mocked(useLinks.useLinks).mockReturnValue({
      data: mockLinks,
      isLoading: false,
    } as any);

    vi.mocked(useLinks.useCategories).mockReturnValue({
      data: mockCategories,
      isLoading: false,
    } as any);

    vi.mocked(useFavoriteMutations.useAddFavorite).mockReturnValue({
      mutate: mockAddFavorite,
    } as any);

    vi.mocked(useFavoriteMutations.useRemoveFavorite).mockReturnValue({
      mutate: mockRemoveFavorite,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Provider Initialization', () => {
    it('should provide context value', () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      expect(result.current).toBeDefined();
      expect(result.current.links).toBeDefined();
      expect(result.current.linkCategories).toBeDefined();
    });

    it('should throw error when used outside provider', () => {
      const originalError = console.error;
      console.error = vi.fn();

      expect(() => {
        renderHook(() => useLinksPageContext());
      }).toThrow('useLinksPageContext must be used within a LinksProvider');

      console.error = originalError;
    });
  });

  describe('Data Transformation', () => {
    it('should transform API links to app format', async () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.links).toHaveLength(3);
      });

      const firstLink = result.current.links[0];
      expect(firstLink).toEqual({
        id: 'link-1',
        title: 'Link 1',
        url: 'https://example.com/1',
        description: 'First link',
        categoryId: 'cat-1',
        tags: ['tag1'],
        favorite: true, // link-1 is in favorites
      });
    });

    it('should use HelpCircle icon for unknown icon names', async () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        const unknownCategory = result.current.linkCategories.find(
          cat => cat.id === 'cat-3'
        );
        expect(unknownCategory).toBeDefined();
        expect(unknownCategory?.icon).toBeDefined();
      });
    });

    it('should mark links as favorites based on currentUser data', async () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        const link1 = result.current.links.find(l => l.id === 'link-1');
        const link2 = result.current.links.find(l => l.id === 'link-2');
        const link3 = result.current.links.find(l => l.id === 'link-3');

        expect(link1?.favorite).toBe(true);
        expect(link2?.favorite).toBe(true);
        expect(link3?.favorite).toBe(false);
      });
    });

    it('should handle no favorite links', async () => {
      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: { ...mockCurrentUser, link: [] },
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.links.every(l => !l.favorite)).toBe(true);
      });
    });

    it('should return empty arrays when no data', async () => {
      vi.mocked(useLinks.useLinks).mockReturnValue({
        data: null,
        isLoading: false,
      } as any);

      vi.mocked(useLinks.useCategories).mockReturnValue({
        data: null,
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.links).toEqual([]);
        expect(result.current.linkCategories).toEqual([]);
      });
    });
  });

  describe('Favorite Link IDs Set', () => {
    it('should create Set of favorite link IDs', async () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.favoriteLinkIds.has('link-1')).toBe(true);
        expect(result.current.favoriteLinkIds.has('link-2')).toBe(true);
        expect(result.current.favoriteLinkIds.has('link-3')).toBe(false);
      });
    });

    it('should return empty Set when no current user', async () => {
      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.favoriteLinkIds.size).toBe(0);
      });
    });

    it('should return empty Set when user has no links', async () => {
      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: { ...mockCurrentUser, link: undefined },
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.favoriteLinkIds.size).toBe(0);
      });
    });
  });

  describe('Filtering Logic', () => {
    it('should filter links by search term', async () => {
      vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('Link 1');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.filteredLinks).toHaveLength(1);
        expect(result.current.filteredLinks[0].id).toBe('link-1');
      });
    });

    it('should filter links by search term case-insensitively', async () => {
      vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('LINK 2');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.filteredLinks).toHaveLength(1);
        expect(result.current.filteredLinks[0].id).toBe('link-2');
      });
    });

    it('should filter links by description', async () => {
      vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('Third');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.filteredLinks).toHaveLength(1);
        expect(result.current.filteredLinks[0].id).toBe('link-3');
      });
    });

    it('should filter links by category', async () => {
      vi.mocked(linksPageStore.useLinksSelectedCategoryId).mockReturnValue('cat-1');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.filteredLinks).toHaveLength(2);
        expect(result.current.filteredLinks.every(l => l.categoryId === 'cat-1')).toBe(true);
      });
    });

    it('should show all links when category is "all"', async () => {
      vi.mocked(linksPageStore.useLinksSelectedCategoryId).mockReturnValue('all');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.filteredLinks).toHaveLength(3);
      });
    });

    it('should filter by both search and category', async () => {
      vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('Link');
      vi.mocked(linksPageStore.useLinksSelectedCategoryId).mockReturnValue('cat-2');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.filteredLinks).toHaveLength(1);
        expect(result.current.filteredLinks[0].id).toBe('link-3');
      });
    });

    it('should return empty array when no matches', async () => {
      vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('nonexistent');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.filteredLinks).toEqual([]);
      });
    });

    it('should handle links without description', async () => {
      vi.mocked(useLinks.useLinks).mockReturnValue({
        data: [{
          id: 'link-no-desc',
          title: 'No Description',
          url: 'https://example.com',
          category_id: 'cat-1',
          tags: [],
        }] as any,
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.filteredLinks).toHaveLength(1);
      });
    });

    // New tests for category name and tags search matching
    it('should filter links by category name search term', async () => {
        // "Development" category should match "dev"
        vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('dev');

        const { result } = renderHook(() => useLinksPageContext(), {
            wrapper: LinksProvider,
        });

        await waitFor(() => {
            expect(result.current.filteredLinks.map(l => l.id).sort()).toEqual(['link-1', 'link-2']);
        });
    });

    it('should filter by tag text', async () => {
        vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('tag3');

        const { result } = renderHook(() => useLinksPageContext(), {
            wrapper: LinksProvider,
        });

        await waitFor(() => {
            expect(result.current.filteredLinks).toHaveLength(1);
            expect(result.current.filteredLinks[0].id).toBe('link-3');
        });
    });

    it('should support partial tag match', async () => {
        // All tags are "tag1", "tag2", "tag3" so "ag" should match all
        vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('ag');

        const { result } = renderHook(() => useLinksPageContext(), {
            wrapper: LinksProvider,
        });

        await waitFor(() => {
            expect(result.current.filteredLinks).toHaveLength(3);
            expect(result.current.filteredLinks.map(l => l.id).sort()).toEqual(['link-1', 'link-2', 'link-3']);
        });
    });

    it('should filter links by category name case-insensitively', async () => {
        // "Security" category should match "SECUR" (avoid matching "Second" in description)
        vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('SECUR');

        const { result } = renderHook(() => useLinksPageContext(), {
            wrapper: LinksProvider,
        });

        await waitFor(() => {
            expect(result.current.filteredLinks).toHaveLength(1);
            expect(result.current.filteredLinks[0].id).toBe('link-3');
        });
    });
  });

  describe('Links Grouped by Category', () => {
    it('should group filtered links by category', async () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.linksByCategory['cat-1']).toHaveLength(2);
        expect(result.current.linksByCategory['cat-2']).toHaveLength(1);
      });
    });

    it('should update grouping when filter changes', async () => {
      vi.mocked(linksPageStore.useLinksSelectedCategoryId).mockReturnValue('cat-1');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.linksByCategory['cat-1']).toHaveLength(2);
        expect(result.current.linksByCategory['cat-2']).toBeUndefined();
      });
    });

    it('should return empty object when no links', async () => {
      vi.mocked(useLinks.useLinks).mockReturnValue({
        data: [],
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.linksByCategory).toEqual({});
      });
    });
  });

  describe('Toggle Favorite', () => {
    it('should add link to favorites', async () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.links).toHaveLength(3);
      });

      act(() => {
        result.current.handleToggleFavorite('link-3');
      });

      await waitFor(() => {
        expect(mockAddFavorite).toHaveBeenCalledWith(
          { userId: 'user-123', linkId: 'link-3' },
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });

    it('should remove link from favorites', async () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.links).toHaveLength(3);
      });

      act(() => {
        result.current.handleToggleFavorite('link-1');
      });

      await waitFor(() => {
        expect(mockRemoveFavorite).toHaveBeenCalledWith(
          { userId: 'user-123', linkId: 'link-1' },
          expect.objectContaining({
            onSuccess: expect.any(Function),
            onError: expect.any(Function),
          })
        );
      });
    });

    it('should show toast on add success', async () => {
      mockAddFavorite.mockImplementation((variables, options) => {
        options.onSuccess();
      });

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.links).toHaveLength(3);
      });

      act(() => {
        result.current.handleToggleFavorite('link-3');
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Added to favorites',
          description: 'This link has been added to your favorites.',
        });
      });
    });

    it('should show toast on remove success', async () => {
      mockRemoveFavorite.mockImplementation((variables, options) => {
        options.onSuccess();
      });

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.links).toHaveLength(3);
      });

      act(() => {
        result.current.handleToggleFavorite('link-1');
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Removed from favorites',
          description: 'This link has been removed from your favorites.',
        });
      });
    });

    it('should show error toast on add failure', async () => {
      mockAddFavorite.mockImplementation((variables, options) => {
        options.onError(new Error('Add failed'));
      });

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.links).toHaveLength(3);
      });

      act(() => {
        result.current.handleToggleFavorite('link-3');
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Failed to add to favorites',
          description: 'Add failed',
        });
      });
    });

    it('should show error toast on remove failure', async () => {
      mockRemoveFavorite.mockImplementation((variables, options) => {
        options.onError(new Error('Remove failed'));
      });

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.links).toHaveLength(3);
      });

      act(() => {
        result.current.handleToggleFavorite('link-1');
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Failed to remove from favorites',
          description: 'Remove failed',
        });
      });
    });

    it('should show auth error when user not logged in', async () => {
      vi.mocked(useMembers.useCurrentUser).mockReturnValue({
        data: undefined,
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.links).toHaveLength(3);
      });

      act(() => {
        result.current.handleToggleFavorite('link-1');
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Authentication required',
          description: 'Please log in to manage favorites.',
        });
      });

      expect(mockAddFavorite).not.toHaveBeenCalled();
      expect(mockRemoveFavorite).not.toHaveBeenCalled();
    });

    it('should do nothing for non-existent link', async () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.links).toHaveLength(3);
      });

      act(() => {
        result.current.handleToggleFavorite('non-existent');
      });

      expect(mockAddFavorite).not.toHaveBeenCalled();
      expect(mockRemoveFavorite).not.toHaveBeenCalled();
    });

    it('should handle error without message', async () => {
      mockAddFavorite.mockImplementation((variables, options) => {
        options.onError({} as Error);
      });

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.links).toHaveLength(3);
      });

      act(() => {
        result.current.handleToggleFavorite('link-3');
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          variant: 'destructive',
          title: 'Failed to add to favorites',
          description: 'There was an error adding this link to your favorites.',
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading when links are loading', async () => {
      vi.mocked(useLinks.useLinks).mockReturnValue({
        data: mockLinks,
        isLoading: true,
      } as any);

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });

    it('should show loading when categories are loading', async () => {
      vi.mocked(useLinks.useCategories).mockReturnValue({
        data: mockCategories,
        isLoading: true,
      } as any);

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });
    });

    it('should not show loading when both are loaded', async () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Zustand Integration', () => {
    it('should use search term from Zustand', async () => {
      vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('test search');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.searchTerm).toBe('test search');
      });
    });

    it('should use selected category from Zustand', async () => {
      vi.mocked(linksPageStore.useLinksSelectedCategoryId).mockReturnValue('cat-1');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.selectedCategoryId).toBe('cat-1');
      });
    });

    it('should use view mode from Zustand', async () => {
      vi.mocked(linksPageStore.useLinksViewMode).mockReturnValue('list');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.viewMode).toBe('list');
      });
    });

    it('should provide Zustand action functions', async () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.setSearchTerm).toBe(mockSetSearchTerm);
        expect(result.current.setSelectedCategoryId).toBe(mockSetSelectedCategoryId);
        expect(result.current.setViewMode).toBe(mockSetViewMode);
      });
    });
  });

  describe('Context Value Structure', () => {
    it('should provide all expected properties', async () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current).toHaveProperty('links');
        expect(result.current).toHaveProperty('linkCategories');
        expect(result.current).toHaveProperty('isLoading');
        expect(result.current).toHaveProperty('searchTerm');
        expect(result.current).toHaveProperty('selectedCategoryId');
        expect(result.current).toHaveProperty('setSearchTerm');
        expect(result.current).toHaveProperty('setSelectedCategoryId');
        expect(result.current).toHaveProperty('viewMode');
        expect(result.current).toHaveProperty('setViewMode');
        expect(result.current).toHaveProperty('filteredLinks');
        expect(result.current).toHaveProperty('linksByCategory');
        expect(result.current).toHaveProperty('handleToggleFavorite');
        expect(result.current).toHaveProperty('currentUser');
        expect(result.current).toHaveProperty('favoriteLinkIds');
      });
    });

    it('should have correct types for properties', async () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(Array.isArray(result.current.links)).toBe(true);
        expect(Array.isArray(result.current.linkCategories)).toBe(true);
        expect(typeof result.current.isLoading).toBe('boolean');
        expect(typeof result.current.searchTerm).toBe('string');
        expect(typeof result.current.selectedCategoryId).toBe('string');
        expect(typeof result.current.setSearchTerm).toBe('function');
        expect(typeof result.current.setSelectedCategoryId).toBe('function');
        expect(typeof result.current.viewMode).toBe('string');
        expect(typeof result.current.setViewMode).toBe('function');
        expect(Array.isArray(result.current.filteredLinks)).toBe(true);
        expect(typeof result.current.linksByCategory).toBe('object');
        expect(typeof result.current.handleToggleFavorite).toBe('function');
        expect(result.current.favoriteLinkIds instanceof Set).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle categories without categories array', async () => {
      vi.mocked(useLinks.useCategories).mockReturnValue({
        data: {},
        isLoading: false,
      } as any);

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.linkCategories).toEqual([]);
      });
    });

    it('should handle empty strings in search', async () => {
      vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.filteredLinks).toHaveLength(3);
      });
    });

    it('should handle special characters in search', async () => {
      vi.mocked(linksPageStore.useLinksSearchTerm).mockReturnValue('Link (1)');

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: LinksProvider,
      });

      await waitFor(() => {
        expect(result.current.filteredLinks).toHaveLength(0);
      });
    });
  });
});
