import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React, { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import the context and components to test
import { 
  QuickLinksProvider, 
  useQuickLinksContext, 
  ICON_MAP 
} from '../../src/contexts/QuickLinksContext';

// Import types
import type { UserMeResponse, UserLink, ApiCategory } from '../../src/types/api';
import type { QuickLink } from '../../src/contexts/QuickLinksContext';

/**
 * QuickLinksContext Tests
 * 
 * Comprehensive tests for the QuickLinksContext provider and hook including:
 * - Data transformation from UserMeResponse to QuickLink format
 * - Search and filtering functionality
 * - Delete dialog management
 * - Favorite toggle handling
 * - Custom handlers support (for team links)
 * - Category filtering and transformation
 */

// ============================================================================
// MOCKS
// ============================================================================

// Mock all API hooks
vi.mock('../../src/hooks/api/useLinks', () => ({
  useCategories: vi.fn(),
}));

vi.mock('../../src/hooks/api/useMembers', () => ({
  useCurrentUser: vi.fn(),
}));

vi.mock('../../src/hooks/api/mutations/useFavoriteMutations', () => ({
  useRemoveFavorite: vi.fn(),
}));

vi.mock('../../src/hooks/api/mutations/useDeleteLinkMutation', () => ({
  useDeleteLink: vi.fn(),
}));

vi.mock('../../src/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

// Import mocked modules
import { useCategories } from '../../src/hooks/api/useLinks';
import { useCurrentUser } from '../../src/hooks/api/useMembers';
import { useRemoveFavorite } from '../../src/hooks/api/mutations/useFavoriteMutations';
import { useDeleteLink } from '../../src/hooks/api/mutations/useDeleteLinkMutation';
import { useToast } from '../../src/hooks/use-toast';

// Cast to mock functions
const mockUseCategories = useCategories as ReturnType<typeof vi.fn>;
const mockUseCurrentUser = useCurrentUser as ReturnType<typeof vi.fn>;
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

function createWrapper() {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Mock data factories
const createMockUserLink = (overrides?: Partial<UserLink>): UserLink => ({
  id: 'link-123',
  name: 'test-link',
  title: 'Test Link',
  description: 'A test link description',
  url: 'https://example.com',
  category_id: 'cat-1',
  tags: ['test', 'example'],
  favorite: true,
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
  link: [createMockUserLink()],
  ...overrides,
});

// Default mock implementations
const getDefaultMockImplementations = () => {
  const mockToast = vi.fn();
  const mockRemoveFavoriteMutate = vi.fn();
  const mockDeleteLinkMutate = vi.fn();

  return {
    useCurrentUser: {
      data: null,
      isLoading: false,
      error: null,
    },
    useCategories: {
      data: {
        categories: [createMockApiCategory()],
        total: 1,
        page: 1,
        page_size: 10,
      },
      isLoading: false,
      error: null,
    },
    useToast: {
      toast: mockToast,
    },
    useRemoveFavorite: {
      mutate: mockRemoveFavoriteMutate,
      isPending: false,
      error: null,
    },
    useDeleteLink: {
      mutate: mockDeleteLinkMutate,
      isPending: false,
      error: null,
    },
    mockToast,
    mockRemoveFavoriteMutate,
    mockDeleteLinkMutate,
  };
};

const setupDefaultMocks = () => {
  const mocks = getDefaultMockImplementations();
  
  mockUseCurrentUser.mockReturnValue(mocks.useCurrentUser);
  mockUseCategories.mockReturnValue(mocks.useCategories);
  mockUseToast.mockReturnValue(mocks.useToast);
  mockUseRemoveFavorite.mockReturnValue(mocks.useRemoveFavorite);
  mockUseDeleteLink.mockReturnValue(mocks.useDeleteLink);
  
  return mocks;
};

// Default props for QuickLinksProvider
const getDefaultQuickLinksProviderProps = () => ({
  userData: createMockUserMeResponse(),
  ownerId: 'owner-123',
  customHandlers: undefined,
  alwaysShowDelete: false,
});

// Test component that uses the context
const TestConsumer = () => {
  const context = useQuickLinksContext();
  return (
    <div data-testid="test-consumer">
      <div data-testid="quick-links-count">{context.quickLinks.length}</div>
      <div data-testid="filtered-links-count">{context.filteredQuickLinks.length}</div>
      <div data-testid="categories-count">{context.linkCategories.length}</div>
      <div data-testid="search-term">{context.searchTerm}</div>
      <div data-testid="selected-category">{context.selectedCategoryId}</div>
      <div data-testid="is-loading">{context.isLoading.toString()}</div>
      <div data-testid="delete-dialog-open">{context.deleteDialog.isOpen.toString()}</div>
      <div data-testid="delete-dialog-link-id">{context.deleteDialog.linkId}</div>
      <div data-testid="always-show-delete">{(context.alwaysShowDelete || false).toString()}</div>
    </div>
  );
};

// ============================================================================
// TESTS
// ============================================================================

describe('QuickLinksContext', () => {
  let defaultMocks: ReturnType<typeof getDefaultMockImplementations>;

  beforeEach(() => {
    vi.clearAllMocks();
    defaultMocks = setupDefaultMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // BASIC FUNCTIONALITY TESTS
  // ============================================================================

  describe('QuickLinksProvider Basic Functionality', () => {
    it('should initialize with correct default state and expose all required properties', () => {
      const props = getDefaultQuickLinksProviderProps();
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      const contextValue = result.current;

      // Default state
      expect(contextValue.searchTerm).toBe('');
      expect(contextValue.selectedCategoryId).toBe('all');
      expect(contextValue.quickLinks).toHaveLength(1);
      expect(contextValue.filteredQuickLinks).toHaveLength(1);
      expect(contextValue.isLoading).toBe(false);
      expect(contextValue.deleteDialog.isOpen).toBe(false);

      // Required properties
      expect(contextValue).toHaveProperty('quickLinks');
      expect(contextValue).toHaveProperty('filteredQuickLinks');
      expect(contextValue).toHaveProperty('linkCategories');
      expect(contextValue).toHaveProperty('isLoading');
      expect(contextValue).toHaveProperty('searchTerm');
      expect(contextValue).toHaveProperty('setSearchTerm');
      expect(contextValue).toHaveProperty('selectedCategoryId');
      expect(contextValue).toHaveProperty('setSelectedCategoryId');
      expect(contextValue).toHaveProperty('handleToggleFavorite');
      expect(contextValue).toHaveProperty('handleDeleteClick');
      expect(contextValue).toHaveProperty('handleDeleteConfirm');
      expect(contextValue).toHaveProperty('handleDeleteCancel');
      expect(contextValue).toHaveProperty('deleteDialog');
      expect(contextValue).toHaveProperty('ownerId');
      expect(contextValue).toHaveProperty('customHandlers');
      expect(contextValue).toHaveProperty('alwaysShowDelete');
    });

    it('should handle empty userData gracefully', () => {
      const props = {
        ...getDefaultQuickLinksProviderProps(),
        userData: undefined,
      };
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      expect(result.current.quickLinks).toEqual([]);
      expect(result.current.filteredQuickLinks).toEqual([]);
      expect(result.current.isLoading).toBe(true);
    });
  });

  // ============================================================================
  // DATA TRANSFORMATION TESTS
  // ============================================================================

  describe('Data Transformation', () => {
    it('should transform UserLink to QuickLink format', () => {
      const mockUserLinks = [
        createMockUserLink({ 
          id: 'link-1', 
          title: 'Development Tool',
          category_id: 'dev-tools',
          favorite: true,
        }),
        createMockUserLink({ 
          id: 'link-2', 
          title: 'Security Guide',
          category_id: 'security',
          favorite: false,
        }),
      ];

      const mockCategories = [
        createMockApiCategory({ id: 'dev-tools', title: 'Development', icon: 'Code' }),
        createMockApiCategory({ id: 'security', title: 'Security', icon: 'Shield' }),
      ];

      mockUseCategories.mockReturnValue({
        data: { categories: mockCategories },
        isLoading: false,
        error: null,
      });

      const props = {
        ...getDefaultQuickLinksProviderProps(),
        userData: createMockUserMeResponse({ link: mockUserLinks }),
      };
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      const { quickLinks } = result.current;

      expect(quickLinks).toHaveLength(2);
      expect(quickLinks[0]).toEqual({
        id: 'link-1',
        title: 'Development Tool',
        url: 'https://example.com',
        icon: 'Code',
        category: 'Development',
        categoryId: 'dev-tools',
        categoryColor: 'bg-blue-500',
        description: 'A test link description',
        tags: ['test', 'example'],
        isFavorite: true,
      });
      expect(quickLinks[1]).toEqual({
        id: 'link-2',
        title: 'Security Guide',
        url: 'https://example.com',
        icon: 'Shield',
        category: 'Security',
        categoryId: 'security',
        categoryColor: 'bg-blue-500',
        description: 'A test link description',
        tags: ['test', 'example'],
        isFavorite: false,
      });
    });

    it('should handle missing category gracefully', () => {
      const mockUserLinks = [
        createMockUserLink({ 
          id: 'link-1',
          name: 'Fallback Name',
          category_id: 'unknown-category',
        }),
      ];

      mockUseCategories.mockReturnValue({
        data: { categories: [] },
        isLoading: false,
        error: null,
      });

      const props = {
        ...getDefaultQuickLinksProviderProps(),
        userData: createMockUserMeResponse({ link: mockUserLinks }),
      };
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      const { quickLinks } = result.current;

      expect(quickLinks[0]).toEqual(expect.objectContaining({
        icon: 'HelpCircle', // Should fallback to HelpCircle
        category: 'Fallback Name', // Should use link.name as fallback
        categoryColor: 'bg-primary', // Should use default color
      }));
    });

    it('should transform categories to LinkCategory format for filtering', () => {
      const mockUserLinks = [
        createMockUserLink({ category_id: 'dev-tools' }),
        createMockUserLink({ id: 'link-2', category_id: 'security' }),
      ];

      const mockCategories = [
        createMockApiCategory({ id: 'dev-tools', title: 'Development', icon: 'Code' }),
        createMockApiCategory({ id: 'security', title: 'Security', icon: 'Shield' }),
        createMockApiCategory({ id: 'unused', title: 'Unused Category', icon: 'Cloud' }),
      ];

      mockUseCategories.mockReturnValue({
        data: { categories: mockCategories },
        isLoading: false,
        error: null,
      });

      const props = {
        ...getDefaultQuickLinksProviderProps(),
        userData: createMockUserMeResponse({ link: mockUserLinks }),
      };
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      const { linkCategories } = result.current;

      // Should only include categories that have links
      expect(linkCategories).toHaveLength(2);
      expect(linkCategories.find(cat => cat.id === 'unused')).toBeUndefined();
      expect(linkCategories.find(cat => cat.id === 'dev-tools')).toBeTruthy();
      expect(linkCategories.find(cat => cat.id === 'security')).toBeTruthy();
    });

    it('should handle empty user links gracefully', () => {
      const props = {
        ...getDefaultQuickLinksProviderProps(),
        userData: createMockUserMeResponse({ link: [] }),
      };
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      expect(result.current.quickLinks).toEqual([]);
      expect(result.current.filteredQuickLinks).toEqual([]);
      expect(result.current.linkCategories).toEqual([]);
    });
  });

  // ============================================================================
  // SEARCH AND FILTERING TESTS
  // ============================================================================

  describe('Search and Filtering', () => {
    it('should filter links by search term in title, description, and tags', () => {
      const mockUserLinks = [
        createMockUserLink({ 
          id: 'link-1', 
          title: 'React Documentation', 
          description: 'Official React docs',
          tags: ['react', 'frontend'],
          category_id: 'dev-tools'
        }),
        createMockUserLink({ 
          id: 'link-2', 
          title: 'Vue.js Guide', 
          description: 'Getting started with Vue',
          tags: ['vue', 'frontend'],
          category_id: 'dev-tools'
        }),
        createMockUserLink({ 
          id: 'link-3', 
          title: 'Security Guide', 
          description: 'How to secure your applications',
          tags: ['security', 'best-practices'],
          category_id: 'security'
        }),
      ];

      const mockCategories = [
        createMockApiCategory({ id: 'dev-tools', title: 'Development' }),
        createMockApiCategory({ id: 'security', title: 'Security' }),
      ];

      mockUseCategories.mockReturnValue({
        data: { categories: mockCategories },
        isLoading: false,
        error: null,
      });

      const props = {
        ...getDefaultQuickLinksProviderProps(),
        userData: createMockUserMeResponse({ link: mockUserLinks }),
      };
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      // Test search by title (case insensitive)
      act(() => {
        result.current.setSearchTerm('REACT');
      });
      expect(result.current.filteredQuickLinks).toHaveLength(1);
      expect(result.current.filteredQuickLinks[0].title).toBe('React Documentation');

      // Test search by description
      act(() => {
        result.current.setSearchTerm('secure');
      });
      expect(result.current.filteredQuickLinks).toHaveLength(1);
      expect(result.current.filteredQuickLinks[0].title).toBe('Security Guide');

      // Test search by tags
      act(() => {
        result.current.setSearchTerm('frontend');
      });
      expect(result.current.filteredQuickLinks).toHaveLength(2);
      expect(result.current.filteredQuickLinks.map(link => link.title))
        .toEqual(['React Documentation', 'Vue.js Guide']);
    });

    it('should filter links by category and combine with search', () => {
      const mockUserLinks = [
        createMockUserLink({ 
          id: 'link-1', 
          title: 'React Tool', 
          category_id: 'dev-tools' 
        }),
        createMockUserLink({ 
          id: 'link-2', 
          title: 'Vue Tool', 
          category_id: 'dev-tools' 
        }),
        createMockUserLink({ 
          id: 'link-3', 
          title: 'React Security', 
          category_id: 'security' 
        }),
      ];

      const mockCategories = [
        createMockApiCategory({ id: 'dev-tools', title: 'Development' }),
        createMockApiCategory({ id: 'security', title: 'Security' }),
      ];

      mockUseCategories.mockReturnValue({
        data: { categories: mockCategories },
        isLoading: false,
        error: null,
      });

      const props = {
        ...getDefaultQuickLinksProviderProps(),
        userData: createMockUserMeResponse({ link: mockUserLinks }),
      };
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      // Test category filter
      act(() => {
        result.current.setSelectedCategoryId('security');
      });
      expect(result.current.filteredQuickLinks).toHaveLength(1);
      expect(result.current.filteredQuickLinks[0].title).toBe('React Security');

      // Test combined search and category filter
      act(() => {
        result.current.setSearchTerm('React');
        result.current.setSelectedCategoryId('dev-tools');
      });
      expect(result.current.filteredQuickLinks).toHaveLength(1);
      expect(result.current.filteredQuickLinks[0].title).toBe('React Tool');

      // Test "all" category shows all links
      act(() => {
        result.current.setSearchTerm('');
        result.current.setSelectedCategoryId('all');
      });
      expect(result.current.filteredQuickLinks).toHaveLength(3);
    });
  });

  // ============================================================================
  // DELETE DIALOG MANAGEMENT TESTS
  // ============================================================================

  describe('Delete Dialog Management', () => {
    it('should open delete dialog when handleDeleteClick is called', () => {
      const props = getDefaultQuickLinksProviderProps();
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      act(() => {
        result.current.handleDeleteClick('link-123', 'Test Link');
      });

      expect(result.current.deleteDialog).toEqual({
        isOpen: true,
        linkId: 'link-123',
        linkTitle: 'Test Link',
      });
    });

    it('should close delete dialog when handleDeleteCancel is called', () => {
      const props = getDefaultQuickLinksProviderProps();
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      // First open the dialog
      act(() => {
        result.current.handleDeleteClick('link-123', 'Test Link');
      });

      expect(result.current.deleteDialog.isOpen).toBe(true);

      // Then cancel it
      act(() => {
        result.current.handleDeleteCancel();
      });

      expect(result.current.deleteDialog).toEqual({
        isOpen: false,
        linkId: '',
        linkTitle: '',
      });
    });

    it('should use custom delete handler when provided', () => {
      const mockCustomDeleteHandler = vi.fn();
      
      const props = {
        ...getDefaultQuickLinksProviderProps(),
        customHandlers: {
          onDeleteLink: mockCustomDeleteHandler,
        },
      };
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      // Open dialog first
      act(() => {
        result.current.handleDeleteClick('link-123', 'Test Link');
      });

      // Confirm delete
      act(() => {
        result.current.handleDeleteConfirm();
      });

      expect(mockCustomDeleteHandler).toHaveBeenCalledWith('link-123');
      expect(result.current.deleteDialog.isOpen).toBe(false); // Should close dialog
    });

    it('should use default delete mutation when no custom handler provided', () => {
      const mocks = setupDefaultMocks();
      
      const props = getDefaultQuickLinksProviderProps();
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      // Open dialog first
      act(() => {
        result.current.handleDeleteClick('link-123', 'Test Link');
      });

      // Confirm delete
      act(() => {
        result.current.handleDeleteConfirm();
      });

      expect(mocks.mockDeleteLinkMutate).toHaveBeenCalledWith('link-123', expect.any(Object));
    });

  });

  // ============================================================================
  // FAVORITE TOGGLE TESTS
  // ============================================================================

  describe('Favorite Toggle', () => {
    it('should use custom favorite handler when provided', () => {
      const mockCustomFavoriteHandler = vi.fn();
      
      const props = {
        ...getDefaultQuickLinksProviderProps(),
        customHandlers: {
          onToggleFavorite: mockCustomFavoriteHandler,
        },
      };
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      act(() => {
        result.current.handleToggleFavorite('link-123');
      });

      expect(mockCustomFavoriteHandler).toHaveBeenCalledWith('link-123');
    });

    it('should use default favorite removal when no custom handler provided', () => {
      const mocks = setupDefaultMocks();
      
      mockUseCurrentUser.mockReturnValue({
        data: createMockUserMeResponse({ id: 'user-123' }),
        isLoading: false,
        error: null,
      });

      const props = getDefaultQuickLinksProviderProps();
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      act(() => {
        result.current.handleToggleFavorite('link-123');
      });

      expect(mocks.mockRemoveFavoriteMutate).toHaveBeenCalledWith(
        { userId: 'user-123', linkId: 'link-123' },
        expect.any(Object)
      );
    });

    it('should show authentication error when user is not logged in', () => {
      const mocks = setupDefaultMocks();
      
      mockUseCurrentUser.mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      const props = getDefaultQuickLinksProviderProps();
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      act(() => {
        result.current.handleToggleFavorite('link-123');
      });

      expect(mocks.mockToast).toHaveBeenCalledWith({
        variant: "destructive",
        title: "Authentication required",
        description: "Please log in to manage favorites.",
      });
    });

    it('should show success toast on successful favorite removal', () => {
      const mocks = setupDefaultMocks();
      
      // Mock successful mutation
      mocks.mockRemoveFavoriteMutate.mockImplementation((_, { onSuccess }) => {
        onSuccess();
      });

      mockUseCurrentUser.mockReturnValue({
        data: createMockUserMeResponse({ id: 'user-123' }),
        isLoading: false,
        error: null,
      });

      const props = getDefaultQuickLinksProviderProps();
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      act(() => {
        result.current.handleToggleFavorite('link-123');
      });

      expect(mocks.mockToast).toHaveBeenCalledWith({
        title: "Removed from favorites",
        description: "This link has been removed from your favorites and Quick Links.",
      });
    });
  });

  // ============================================================================
  // CONFIGURATION PROPS TESTS
  // ============================================================================

  describe('Configuration Props', () => {
    it('should pass through all configuration props correctly', () => {
      const customHandlers = {
        onDeleteLink: vi.fn(),
        onToggleFavorite: vi.fn(),
      };

      const props = {
        ...getDefaultQuickLinksProviderProps(),
        ownerId: 'custom-owner-123',
        alwaysShowDelete: true,
        customHandlers,
      };
      
      const { result } = renderHook(() => useQuickLinksContext(), {
        wrapper: ({ children }) => (
          <QuickLinksProvider {...props}>
            {children}
          </QuickLinksProvider>
        ),
      });

      expect(result.current.ownerId).toBe('custom-owner-123');
      expect(result.current.alwaysShowDelete).toBe(true);
      expect(result.current.customHandlers).toBe(customHandlers);
    });
  });

  // ============================================================================
  // HOOK USAGE ERROR TESTS
  // ============================================================================

  describe('Hook Usage Errors', () => {
    it('should throw error when used outside provider but work correctly when used within provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Should throw when used outside provider
      expect(() => {
        renderHook(() => useQuickLinksContext());
      }).toThrow('useQuickLinksContext must be used within a QuickLinksProvider');
      
      consoleSpy.mockRestore();

      // Should not throw when used within provider
      const props = getDefaultQuickLinksProviderProps();
      expect(() => {
        renderHook(() => useQuickLinksContext(), {
          wrapper: ({ children }) => (
            <QuickLinksProvider {...props}>
              {children}
            </QuickLinksProvider>
          ),
        });
      }).not.toThrow();
    });
  });

  // ============================================================================
  // ICON MAP TESTS
  // ============================================================================

  describe('ICON_MAP', () => {
    it('should export icon map that matches SHARED_ICON_MAP', () => {
      expect(ICON_MAP).toBeDefined();
      // Test that it has the same icons as SHARED_ICON_MAP from LinksPageContext
      expect(ICON_MAP.Code).toBeDefined();
      expect(ICON_MAP.Shield).toBeDefined();
      expect(ICON_MAP.Monitor).toBeDefined();
      expect(ICON_MAP.Users).toBeDefined();
      expect(ICON_MAP.FileText).toBeDefined();
      expect(ICON_MAP.Wrench).toBeDefined();
      expect(ICON_MAP.Cloud).toBeDefined();
      expect(ICON_MAP.TestTube).toBeDefined();
      expect(ICON_MAP.HelpCircle).toBeDefined();
    });
  });
});
