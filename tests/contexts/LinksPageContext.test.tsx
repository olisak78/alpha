import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import the context and components to test
import { 
  LinksProvider, 
  useLinksPageContext, 
  SHARED_ICON_MAP 
} from '../../src/contexts/LinksPageContext';

// Import types
import type { ApiLink, ApiCategory, UserMeResponse } from '../../src/types/api';

/**
 * LinksPageContext Tests
 * 
 * Tests for the LinksPageContext provider and hook including:
 * - Basic functionality and data transformation
 * - Search and filtering functionality
 * - Favorite link management
 * - Loading states and error handling
 */

// ============================================================================
// MOCKS
// ============================================================================

// Mock all API hooks
vi.mock('../../src/hooks/api/useLinks', () => ({
  useLinks: vi.fn(),
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

// Import mocked modules
import { useLinks, useCategories } from '../../src/hooks/api/useLinks';
import { useCurrentUser } from '../../src/hooks/api/useMembers';
import { useAddFavorite, useRemoveFavorite } from '../../src/hooks/api/mutations/useFavoriteMutations';
import { useToast } from '../../src/hooks/use-toast';

// Cast to mock functions
const mockUseLinks = useLinks as ReturnType<typeof vi.fn>;
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
const createMockApiLink = (overrides?: Partial<ApiLink>): ApiLink => ({
  id: 'link-123',
  name: 'test-link',
  title: 'Test Link',
  description: 'A test link description',
  url: 'https://example.com',
  category_id: 'cat-1',
  tags: ['test', 'example'],
  ...overrides,
});

const createMockApiCategory = (overrides?: Partial<ApiCategory>): ApiCategory => ({
  id: 'cat-1',
  name: 'test-category',
  title: 'Test Category',
  description: 'A test category',
  icon: 'Code',
  color: 'bg-blue-500',
  ...overrides,
});

const createMockCurrentUser = (overrides?: Partial<UserMeResponse>): UserMeResponse => ({
  id: 'user-123',
  uuid: 'uuid-123',
  team_id: 'team-123',
  first_name: 'John',
  last_name: 'Doe',
  email: 'john@example.com',
  mobile: '123456789',
  team_domain: 'example',
  team_role: 'developer',
  link: [
    {
      id: 'link-123',
      name: 'favorite-link',
      title: 'Favorite Link',
      description: 'A favorite link',
      url: 'https://favorite.com',
      category_id: 'cat-1',
      tags: ['favorite'],
      favorite: true,
    },
  ],
  ...overrides,
});

// Default mock setup
const setupDefaultMocks = () => {
  const mockToast = vi.fn();
  const mockAddFavoriteMutate = vi.fn();
  const mockRemoveFavoriteMutate = vi.fn();

  const mocks = {
    mockToast,
    mockAddFavoriteMutate,
    mockRemoveFavoriteMutate,
  };
  
  mockUseLinks.mockReturnValue({
    data: [createMockApiLink()],
    isLoading: false,
    error: null,
  });

  mockUseCategories.mockReturnValue({
    data: {
      categories: [createMockApiCategory()],
      total: 1,
      page: 1,
      page_size: 10,
    },
    isLoading: false,
    error: null,
  });

  mockUseCurrentUser.mockReturnValue({
    data: createMockCurrentUser(),
    isLoading: false,
    error: null,
  });

  mockUseToast.mockReturnValue({ toast: mockToast });
  mockUseAddFavorite.mockReturnValue({
    mutate: mockAddFavoriteMutate,
    isPending: false,
    error: null,
  });

  mockUseRemoveFavorite.mockReturnValue({
    mutate: mockRemoveFavoriteMutate,
    isPending: false,
    error: null,
  });
  
  return mocks;
};

// Test component that uses the context
const TestConsumer = () => {
  const context = useLinksPageContext();
  return (
    <div data-testid="test-consumer">
      <div data-testid="links-count">{context.links.length}</div>
      <div data-testid="categories-count">{context.linkCategories.length}</div>
      <div data-testid="filtered-links-count">{context.filteredLinks.length}</div>
      <div data-testid="search-term">{context.searchTerm}</div>
      <div data-testid="selected-category">{context.selectedCategoryId}</div>
      <div data-testid="is-loading">{context.isLoading.toString()}</div>
      <div data-testid="favorite-links-count">{context.favoriteLinkIds.size}</div>
    </div>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('LinksPageContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // BASIC FUNCTIONALITY AND DATA TRANSFORMATION
  // ============================================================================

  describe('Basic Functionality and Data Transformation', () => {
    it('should provide context with correct initial state and properties', () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      });

      const contextValue = result.current;

      // Check initial state
      expect(contextValue.searchTerm).toBe('');
      expect(contextValue.selectedCategoryId).toBe('all');
      expect(contextValue.isLoading).toBe(false);
      
      // Check data properties
      expect(contextValue.links).toHaveLength(1);
      expect(contextValue.linkCategories).toHaveLength(1);
      expect(contextValue.filteredLinks).toHaveLength(1);
      
      // Check all required properties exist
      expect(contextValue).toHaveProperty('setSearchTerm');
      expect(contextValue).toHaveProperty('setSelectedCategoryId');
      expect(contextValue).toHaveProperty('linksByCategory');
      expect(contextValue).toHaveProperty('handleToggleFavorite');
      expect(contextValue).toHaveProperty('currentUser');
      expect(contextValue).toHaveProperty('favoriteLinkIds');
    });

    it('should transform API data to UI format correctly', () => {
      const mockLinks = [
        createMockApiLink({ id: 'link-1', title: 'Link 1' }),
        createMockApiLink({ id: 'link-2', title: 'Link 2' }),
      ];

      const mockCategories = [
        createMockApiCategory({ id: 'cat-1', title: 'Development', icon: 'Code' }),
        createMockApiCategory({ id: 'cat-2', title: 'Security', icon: 'UnknownIcon' }),
      ];

      const mockUser = createMockCurrentUser({
        link: [{ id: 'link-1', favorite: true } as any],
      });

      mockUseLinks.mockReturnValue({
        data: mockLinks,
        isLoading: false,
        error: null,
      });

      mockUseCategories.mockReturnValue({
        data: { categories: mockCategories },
        isLoading: false,
        error: null,
      });

      mockUseCurrentUser.mockReturnValue({
        data: mockUser,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      });

      // Check links transformation and favorite status
      expect(result.current.links).toHaveLength(2);
      expect(result.current.links[0].favorite).toBe(true);
      expect(result.current.links[1].favorite).toBe(false);

      // Check categories transformation and icon handling
      expect(result.current.linkCategories).toHaveLength(2);
      expect(result.current.linkCategories[0].icon).toBe(SHARED_ICON_MAP.Code);
      expect(result.current.linkCategories[1].icon).toBeDefined(); // Should use fallback icon
    });

    it('should handle empty data gracefully', () => {
      mockUseLinks.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      mockUseCategories.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      mockUseCurrentUser.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      });

      expect(result.current.links).toEqual([]);
      expect(result.current.linkCategories).toEqual([]);
      expect(result.current.favoriteLinkIds.size).toBe(0);
    });
  });

  // ============================================================================
  // SEARCH AND FILTERING
  // ============================================================================

  describe('Search and Filtering', () => {
    beforeEach(() => {
      const mockLinks = [
        createMockApiLink({ 
          id: 'link-1', 
          title: 'React Documentation', 
          description: 'Official React docs',
          category_id: 'dev-tools' 
        }),
        createMockApiLink({ 
          id: 'link-2', 
          title: 'Vue.js Guide', 
          description: 'Getting started with Vue',
          category_id: 'dev-tools' 
        }),
        createMockApiLink({ 
          id: 'link-3', 
          title: 'Security Best Practices', 
          description: 'How to secure your applications',
          category_id: 'security' 
        }),
      ];

      mockUseLinks.mockReturnValue({
        data: mockLinks,
        isLoading: false,
        error: null,
      });
    });

    it('should filter links by search term in title and description', () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      });

      // Search by title (case insensitive)
      act(() => {
        result.current.setSearchTerm('REACT');
      });
      expect(result.current.filteredLinks).toHaveLength(1);
      expect(result.current.filteredLinks[0].title).toBe('React Documentation');

      // Search by description
      act(() => {
        result.current.setSearchTerm('secure');
      });
      expect(result.current.filteredLinks).toHaveLength(1);
      expect(result.current.filteredLinks[0].title).toBe('Security Best Practices');
    });

    it('should filter links by category and combine with search', () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      });

      // Filter by category
      act(() => {
        result.current.setSelectedCategoryId('security');
      });
      expect(result.current.filteredLinks).toHaveLength(1);
      expect(result.current.filteredLinks[0].title).toBe('Security Best Practices');

      // Combine search and category filters
      act(() => {
        result.current.setSearchTerm('Vue');
        result.current.setSelectedCategoryId('dev-tools');
      });
      expect(result.current.filteredLinks).toHaveLength(1);
      expect(result.current.filteredLinks[0].title).toBe('Vue.js Guide');

      // Show all when category is "all"
      act(() => {
        result.current.setSearchTerm('');
        result.current.setSelectedCategoryId('all');
      });
      expect(result.current.filteredLinks).toHaveLength(3);
    });

    it('should group filtered links by category', () => {
      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      });

      const { linksByCategory } = result.current;

      expect(linksByCategory['dev-tools']).toHaveLength(2);
      expect(linksByCategory['security']).toHaveLength(1);

      // Filter by category should update grouping
      act(() => {
        result.current.setSelectedCategoryId('dev-tools');
      });

      expect(Object.keys(result.current.linksByCategory)).toHaveLength(1);
      expect(result.current.linksByCategory['dev-tools']).toHaveLength(2);
      expect(result.current.linksByCategory['security']).toBeUndefined();
    });
  });

  // ============================================================================
  // FAVORITE MANAGEMENT
  // ============================================================================

  describe('Favorite Management', () => {
    it('should handle favorite toggle for authenticated users', () => {
      const mocks = setupDefaultMocks();
      const mockUser = createMockCurrentUser({ 
        id: 'user-123',
        link: [{ id: 'link-456', favorite: true } as any],
      });
      
      const mockLinks = [
        createMockApiLink({ id: 'link-456', title: 'Favorite Link' }),
        createMockApiLink({ id: 'link-789', title: 'Non-favorite Link' }),
      ];

      mockUseCurrentUser.mockReturnValue({
        data: mockUser,
        isLoading: false,
        error: null,
      });

      mockUseLinks.mockReturnValue({
        data: mockLinks,
        isLoading: false,
        error: null,
      });

      const { result } = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      });

      // Remove favorite
      act(() => {
        result.current.handleToggleFavorite('link-456');
      });
      expect(mocks.mockRemoveFavoriteMutate).toHaveBeenCalledWith(
        { userId: 'user-123', linkId: 'link-456' },
        expect.any(Object)
      );

      // Add favorite
      act(() => {
        result.current.handleToggleFavorite('link-789');
      });
      expect(mocks.mockAddFavoriteMutate).toHaveBeenCalledWith(
        { userId: 'user-123', linkId: 'link-789' },
        expect.any(Object)
      );
    });

    it('should handle authentication errors and success/error toasts', () => {
      const mocks = setupDefaultMocks();
      
      // Test unauthenticated user
      mockUseCurrentUser.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      let result = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      }).result;

      act(() => {
        result.current.handleToggleFavorite('link-123');
      });

      expect(mocks.mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to manage favorites.",
      });

      // Reset mocks and setup for success test
      vi.clearAllMocks();
      const newMocks = setupDefaultMocks();
      
      newMocks.mockAddFavoriteMutate.mockImplementation((_, { onSuccess }) => {
        onSuccess();
      });

      mockUseCurrentUser.mockReturnValue({
        data: createMockCurrentUser({ link: [] }),
        isLoading: false,
        error: null,
      });

      result = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      }).result;

      act(() => {
        result.current.handleToggleFavorite('link-123');
      });

      expect(newMocks.mockToast).toHaveBeenCalledWith({
        title: "Added to favorites",
        description: "This link has been added to your favorites.",
      });

      // Reset and test error toast
      vi.clearAllMocks();
      const errorMocks = setupDefaultMocks();
      
      const error = new Error('Network error');
      errorMocks.mockAddFavoriteMutate.mockImplementation((_, { onError }) => {
        onError(error);
      });

      mockUseCurrentUser.mockReturnValue({
        data: createMockCurrentUser({ link: [] }),
        isLoading: false,
        error: null,
      });

      result = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      }).result;

      act(() => {
        result.current.handleToggleFavorite('link-123');
      });

      expect(errorMocks.mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Failed to add to favorites",
        description: "Network error",
      });
    });
  });

  // ============================================================================
  // LOADING STATES AND ERROR HANDLING
  // ============================================================================

  describe('Loading States and Error Handling', () => {
    it('should handle loading states correctly', () => {
      // Test links loading
      mockUseLinks.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      let result = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      }).result;

      expect(result.current.isLoading).toBe(true);

      // Test categories loading - need fresh render
      mockUseLinks.mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      });

      mockUseCategories.mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      result = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      }).result;

      expect(result.current.isLoading).toBe(true);

      // Test both complete - need fresh render
      mockUseCategories.mockReturnValue({
        data: { categories: [] },
        isLoading: false,
        error: null,
      });

      result = renderHook(() => useLinksPageContext(), {
        wrapper: ({ children }) => (
          <LinksProvider>
            {children}
          </LinksProvider>
        ),
      }).result;

      expect(result.current.isLoading).toBe(false);
    });

    it('should throw error when hook is used outside provider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => useLinksPageContext());
      }).toThrow('useLinksPageContext must be used within a LinksProvider');
      
      consoleSpy.mockRestore();
    });
  });

  // ============================================================================
  // SHARED ICON MAP
  // ============================================================================

  describe('SHARED_ICON_MAP', () => {
    it('should export shared icon map with expected icons', () => {
      expect(SHARED_ICON_MAP).toBeDefined();
      expect(SHARED_ICON_MAP.Code).toBeDefined();
      expect(SHARED_ICON_MAP.Shield).toBeDefined();
      expect(SHARED_ICON_MAP.HelpCircle).toBeDefined(); // Fallback icon
    });
  });
});
