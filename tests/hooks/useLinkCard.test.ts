import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import the hook to test
import { useLinkCard } from '../../src/hooks/useLinkCard';

// Import contexts that the hook might use
import { LinksProvider } from '../../src/contexts/LinksPageContext';
import { QuickLinksProvider } from '../../src/contexts/QuickLinksContext';

// Import types
import type { Link } from '../../src/types/developer-portal';
import type { QuickLink } from '../../src/contexts/QuickLinksContext';
import type { UserMeResponse, ApiCategory } from '../../src/types/api';

/**
 * useLinkCard Hook Tests
 * 
 * Essential tests for the useLinkCard hook covering:
 * - Context detection and behavior differences
 * - Button visibility logic
 * - Category lookup functionality
 * - Key edge cases
 */

// ============================================================================
// MOCKS
// ============================================================================

// Mock all API hooks used by the contexts
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

vi.mock('../../src/hooks/api/mutations/useDeleteLinkMutation', () => ({
  useDeleteLink: vi.fn(),
}));

vi.mock('../../src/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

// Import mocked modules
import { useLinks, useCategories } from '../../src/hooks/api/useLinks';
import { useCurrentUser } from '../../src/hooks/api/useMembers';
import { useAddFavorite, useRemoveFavorite } from '../../src/hooks/api/mutations/useFavoriteMutations';
import { useDeleteLink } from '../../src/hooks/api/mutations/useDeleteLinkMutation';
import { useToast } from '../../src/hooks/use-toast';

// Cast to mock functions
const mockUseLinks = useLinks as ReturnType<typeof vi.fn>;
const mockUseCategories = useCategories as ReturnType<typeof vi.fn>;
const mockUseCurrentUser = useCurrentUser as ReturnType<typeof vi.fn>;
const mockUseAddFavorite = useAddFavorite as ReturnType<typeof vi.fn>;
const mockUseRemoveFavorite = useRemoveFavorite as ReturnType<typeof vi.fn>;
const mockUseDeleteLink = useDeleteLink as ReturnType<typeof vi.fn>;
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

function createBaseWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
}

// Mock data factories
const createMockLink = (overrides?: Partial<Link>): Link => ({
  id: 'link-123',
  title: 'Test Link',
  url: 'https://example.com',
  description: 'A test link',
  categoryId: 'cat-1',
  tags: ['test'],
  favorite: false,
  ...overrides,
});

const createMockQuickLink = (overrides?: Partial<QuickLink>): QuickLink => ({
  id: 'link-123',
  title: 'Test Quick Link',
  url: 'https://example.com',
  icon: 'Code',
  category: 'Development',
  categoryId: 'cat-1',
  categoryColor: 'bg-blue-500',
  description: 'A test quick link',
  tags: ['test'],
  isFavorite: true,
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

const setupDefaultMocks = () => {
  const mockToast = vi.fn();
  const mockAddFavoriteMutate = vi.fn();
  const mockRemoveFavoriteMutate = vi.fn();
  const mockDeleteLinkMutate = vi.fn();

  mockUseLinks.mockReturnValue({
    data: [],
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

  mockUseToast.mockReturnValue({ toast: mockToast });
  mockUseAddFavorite.mockReturnValue({ mutate: mockAddFavoriteMutate, isPending: false, error: null });
  mockUseRemoveFavorite.mockReturnValue({ mutate: mockRemoveFavoriteMutate, isPending: false, error: null });
  mockUseDeleteLink.mockReturnValue({ mutate: mockDeleteLinkMutate, isPending: false, error: null });

  return {
    mockToast,
    mockAddFavoriteMutate,
    mockRemoveFavoriteMutate,
    mockDeleteLinkMutate,
  };
};

// Wrapper factories for different contexts
function createLinksWrapper() {
  const BaseWrapper = createBaseWrapper();
  return ({ children }: { children: ReactNode }) => (
    React.createElement(BaseWrapper, null,
      React.createElement(LinksProvider, null, children)
    )
  );
}

function createQuickLinksWrapper(props?: Partial<React.ComponentProps<typeof QuickLinksProvider>>) {
  const BaseWrapper = createBaseWrapper();
  const defaultProps = {
    userData: createMockUserMeResponse(),
    ownerId: 'owner-123',
    customHandlers: undefined,
    alwaysShowDelete: false,
    ...props,
  };
  
  return ({ children }: { children: ReactNode }) => (
    React.createElement(BaseWrapper, null,
      React.createElement(QuickLinksProvider, { ...defaultProps, children })
    )
  );
}

// ============================================================================
// TESTS
// ============================================================================

describe('useLinkCard Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupDefaultMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Context Detection and Basic Behavior', () => {
    it('should detect no context when used outside providers', () => {
      const link = createMockLink();
      
      const { result } = renderHook(() => useLinkCard(link), {
        wrapper: createBaseWrapper(),
      });

      expect(result.current.showStarButton).toBe(false);
      expect(result.current.showDeleteButton).toBe(false);
      expect(result.current.handleToggleFavorite).toBeUndefined();
      expect(result.current.handleDelete).toBeUndefined();
    });

    it('should detect Links context and show appropriate buttons', () => {
      const link = createMockLink();
      
      const { result } = renderHook(() => useLinkCard(link), {
        wrapper: createLinksWrapper(),
      });

      expect(result.current.showStarButton).toBe(true); // Always show star in LinksPage
      expect(result.current.showDeleteButton).toBe(false); // No delete in LinksPage
      expect(result.current.handleToggleFavorite).toBeDefined();
      expect(result.current.handleDelete).toBeUndefined();
    });

    it('should detect QuickLinks context and handle favorite vs non-favorite links', () => {
      // Test favorite link
      const favoriteQuickLink = createMockQuickLink({ isFavorite: true });
      const { result: favoriteResult } = renderHook(() => useLinkCard(favoriteQuickLink), {
        wrapper: createQuickLinksWrapper(),
      });

      expect(favoriteResult.current.showStarButton).toBe(true);
      expect(favoriteResult.current.showDeleteButton).toBe(false);

      // Test non-favorite link
      const nonFavoriteQuickLink = createMockQuickLink({ isFavorite: false });
      const { result: nonFavoriteResult } = renderHook(() => useLinkCard(nonFavoriteQuickLink), {
        wrapper: createQuickLinksWrapper(),
      });

      expect(nonFavoriteResult.current.showStarButton).toBe(false);
      expect(nonFavoriteResult.current.showDeleteButton).toBe(true);

      // Both should have handlers
      expect(favoriteResult.current.handleToggleFavorite).toBeDefined();
      expect(favoriteResult.current.handleDelete).toBeDefined();
      expect(nonFavoriteResult.current.handleToggleFavorite).toBeDefined();
      expect(nonFavoriteResult.current.handleDelete).toBeDefined();
    });

    it('should handle alwaysShowDelete prop correctly', () => {
      const favoriteQuickLink = createMockQuickLink({ isFavorite: true });
      
      const { result } = renderHook(() => useLinkCard(favoriteQuickLink), {
        wrapper: createQuickLinksWrapper({ alwaysShowDelete: true }),
      });

      expect(result.current.showStarButton).toBe(true);
      expect(result.current.showDeleteButton).toBe(true); // Should show delete when alwaysShowDelete is true
    });
  });

  describe('Category Lookup', () => {
    it('should find matching category when available', () => {
      const link = createMockLink({ categoryId: 'cat-1' });
      
      const { result } = renderHook(() => useLinkCard(link), {
        wrapper: createLinksWrapper(),
      });

      expect(result.current.category).toBeDefined();
      expect(result.current.category?.id).toBe('cat-1');
    });

    it('should return undefined category when no match found', () => {
      const link = createMockLink({ categoryId: 'non-existent-category' });
      
      const { result } = renderHook(() => useLinkCard(link), {
        wrapper: createLinksWrapper(),
      });

      expect(result.current.category).toBeUndefined();
    });

    it('should handle empty categories array', () => {
      mockUseCategories.mockReturnValue({
        data: { categories: [] },
        isLoading: false,
        error: null,
      });

      const link = createMockLink({ categoryId: 'cat-1' });
      
      const { result } = renderHook(() => useLinkCard(link), {
        wrapper: createLinksWrapper(),
      });

      expect(result.current.category).toBeUndefined();
      expect(result.current.showStarButton).toBe(true); // Should still show star button
    });
  });

  describe('Edge Cases', () => {
    it('should handle mixed Link/QuickLink properties correctly', () => {
      // Test object that has both Link and QuickLink properties
      const mixedLink = {
        ...createMockLink({ favorite: true }),
        isFavorite: false, // QuickLink property should take precedence in QuickLinks context
      } as any;
      
      const { result } = renderHook(() => useLinkCard(mixedLink), {
        wrapper: createQuickLinksWrapper(),
      });

      // In QuickLinks context, should use isFavorite over favorite
      expect(result.current.showStarButton).toBe(false); // isFavorite is false
    });

    it('should handle Link type objects in QuickLinks context', () => {
      // Test backward compatibility with Link type
      const link = createMockLink({ favorite: true });
      
      const { result } = renderHook(() => useLinkCard(link), {
        wrapper: createQuickLinksWrapper(),
      });

      expect(result.current.showStarButton).toBe(true); // Should detect favorite from Link.favorite
    });

    it('should handle missing categoryId gracefully', () => {
      const linkWithoutCategory = { ...createMockLink(), categoryId: undefined } as any;
      
      const { result } = renderHook(() => useLinkCard(linkWithoutCategory), {
        wrapper: createLinksWrapper(),
      });

      expect(result.current.category).toBeUndefined();
      expect(result.current.showStarButton).toBe(true); // Should still work
    });
  });

  describe('Context Priority', () => {
    it('should prioritize QuickLinks context over Links context when both are present', () => {
      const BaseWrapper = createBaseWrapper();
      const quickLink = createMockQuickLink({ isFavorite: false });
      
      const NestedWrapper = ({ children }: { children: ReactNode }) => (
        React.createElement(BaseWrapper, null,
          React.createElement(LinksProvider, { children: 
            React.createElement(QuickLinksProvider, { userData: createMockUserMeResponse(), children })
          })
        )
      );

      const { result } = renderHook(() => useLinkCard(quickLink), {
        wrapper: NestedWrapper,
      });

      // Should behave as QuickLinks context (no star for non-favorite)
      expect(result.current.showStarButton).toBe(false);
      expect(result.current.handleDelete).toBeDefined(); // QuickLinks has delete functionality
    });
  });
});
